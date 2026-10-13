// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use tauri::webview::PermissionResponse;

#[derive(Serialize, Clone)]
pub struct PhysicalDisplayInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub is_primary: bool,
}

fn base64_encode(input: &[u8]) -> String {
    const TABLE: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = Vec::with_capacity(((input.len() + 2) / 3) * 4);
    for chunk in input.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;

        out.push(TABLE[((triple >> 18) & 0x3F) as usize]);
        out.push(TABLE[((triple >> 12) & 0x3F) as usize]);
        if chunk.len() > 1 {
            out.push(TABLE[((triple >> 6) & 0x3F) as usize]);
        } else {
            out.push(b'=');
        }
        if chunk.len() > 2 {
            out.push(TABLE[(triple & 0x3F) as usize]);
        } else {
            out.push(b'=');
        }
    }
    unsafe { String::from_utf8_unchecked(out) }
}

#[tauri::command]
fn get_physical_displays() -> Vec<PhysicalDisplayInfo> {
    #[cfg(target_os = "windows")]
    {
        #[link(name = "user32")]
        extern "system" {
            fn GetSystemMetrics(nIndex: i32) -> i32;
        }
        const SM_CXSCREEN: i32 = 0;
        const SM_CYSCREEN: i32 = 1;
        const SM_CMONITORS: i32 = 80;

        unsafe {
            let count = GetSystemMetrics(SM_CMONITORS).max(1) as u32;
            let w = GetSystemMetrics(SM_CXSCREEN).max(1280) as u32;
            let h = GetSystemMetrics(SM_CYSCREEN).max(720) as u32;
            let mut list = Vec::with_capacity(count as usize);
            for i in 1..=count {
                list.push(PhysicalDisplayInfo {
                    id: i,
                    name: if i == 1 {
                        "Primary".to_string()
                    } else {
                        format!("Display {}", i)
                    },
                    width: w,
                    height: h,
                    is_primary: i == 1,
                });
            }
            return list;
        }
    }

    #[cfg(target_os = "macos")]
    {
        #[link(name = "CoreGraphics", kind = "framework")]
        extern "C" {
            fn CGGetActiveDisplayList(
                max_displays: u32,
                active_displays: *mut u32,
                display_count: *mut u32,
            ) -> i32;
            fn CGDisplayPixelsWide(display: u32) -> usize;
            fn CGDisplayPixelsHigh(display: u32) -> usize;
            fn CGMainDisplayID() -> u32;
        }

        unsafe {
            let mut ids = [0u32; 16];
            let mut count = 0u32;
            let res = CGGetActiveDisplayList(16, ids.as_mut_ptr(), &mut count);
            if res == 0 && count > 0 {
                let main_id = CGMainDisplayID();
                let mut list = Vec::with_capacity(count as usize);
                for idx in 0..(count as usize) {
                    let d_id = ids[idx];
                    let w = CGDisplayPixelsWide(d_id).max(1280) as u32;
                    let h = CGDisplayPixelsHigh(d_id).max(720) as u32;
                    let num = (idx + 1) as u32;
                    list.push(PhysicalDisplayInfo {
                        id: num,
                        name: if d_id == main_id || num == 1 {
                            "Primary".to_string()
                        } else {
                            format!("Display {}", num)
                        },
                        width: w,
                        height: h,
                        is_primary: d_id == main_id || num == 1,
                    });
                }
                return list;
            }
        }
    }

    vec![PhysicalDisplayInfo {
        id: 1,
        name: "Primary".to_string(),
        width: 1920,
        height: 1080,
        is_primary: true,
    }]
}

#[tauri::command]
fn capture_desktop_frame(display_index: Option<u32>) -> Result<String, String> {
    let disp_idx = display_index.unwrap_or(1).max(1);

    #[cfg(target_os = "windows")]
    {
        #[repr(C)]
        struct BitmapInfoHeader {
            bi_size: u32,
            bi_width: i32,
            bi_height: i32,
            bi_planes: u16,
            bi_bit_count: u16,
            bi_compression: u32,
            bi_size_image: u32,
            bi_x_pels_per_meter: i32,
            bi_y_pels_per_meter: i32,
            bi_clr_used: u32,
            bi_clr_important: u32,
        }

        #[link(name = "user32")]
        extern "system" {
            fn GetDC(hWnd: isize) -> isize;
            fn ReleaseDC(hWnd: isize, hDC: isize) -> i32;
            fn GetSystemMetrics(nIndex: i32) -> i32;
        }

        #[link(name = "gdi32")]
        extern "system" {
            fn CreateCompatibleDC(hdc: isize) -> isize;
            fn CreateCompatibleBitmap(hdc: isize, cx: i32, cy: i32) -> isize;
            fn SelectObject(hdc: isize, h: isize) -> isize;
            fn SetStretchBltMode(hdc: isize, mode: i32) -> i32;
            fn StretchBlt(
                hdcDest: isize,
                xDest: i32,
                yDest: i32,
                wDest: i32,
                hDest: i32,
                hdcSrc: isize,
                xSrc: i32,
                ySrc: i32,
                wSrc: i32,
                hSrc: i32,
                rop: u32,
            ) -> i32;
            fn GetDIBits(
                hdc: isize,
                hbm: isize,
                start: u32,
                cLines: u32,
                lpvBits: *mut u8,
                lpbmi: *mut BitmapInfoHeader,
                usage: u32,
            ) -> i32;
            fn DeleteObject(ho: isize) -> i32;
            fn DeleteDC(hdc: isize) -> i32;
        }

        const SM_CXSCREEN: i32 = 0;
        const SM_CYSCREEN: i32 = 1;
        const SM_CXVIRTUALSCREEN: i32 = 78;
        const SRCCOPY: u32 = 0x00CC0020;
        const COLORONCOLOR: i32 = 3;

        unsafe {
            let hdc_screen = GetDC(0);
            if hdc_screen == 0 {
                return Err("GetDC failed".to_string());
            }

            let screen_w = GetSystemMetrics(SM_CXSCREEN).max(640);
            let screen_h = GetSystemMetrics(SM_CYSCREEN).max(480);
            let virt_w = GetSystemMetrics(SM_CXVIRTUALSCREEN).max(screen_w);

            let mut src_x = ((disp_idx as i32) - 1) * screen_w;
            if src_x + screen_w > virt_w {
                src_x = 0;
            }

            // Capture at 960x540 (multiple of 4 width for zero BMP row padding and ultra-fast transfer)
            let out_w: i32 = 960;
            let out_h: i32 = 540;

            let hdc_mem = CreateCompatibleDC(hdc_screen);
            let hbm = CreateCompatibleBitmap(hdc_screen, out_w, out_h);
            let old_obj = SelectObject(hdc_mem, hbm);

            SetStretchBltMode(hdc_mem, COLORONCOLOR);
            StretchBlt(
                hdc_mem, 0, 0, out_w, out_h, hdc_screen, src_x, 0, screen_w, screen_h, SRCCOPY,
            );

            let img_size = (out_w * out_h * 3) as usize;
            let file_size = 54 + img_size;
            let mut bmp = vec![0u8; file_size];

            // 14-byte BMP File Header
            bmp[0] = b'B';
            bmp[1] = b'M';
            bmp[2..6].copy_from_slice(&(file_size as u32).to_le_bytes());
            bmp[10..14].copy_from_slice(&54u32.to_le_bytes());

            let mut bih = BitmapInfoHeader {
                bi_size: 40,
                bi_width: out_w,
                bi_height: out_h,
                bi_planes: 1,
                bi_bit_count: 24,
                bi_compression: 0,
                bi_size_image: img_size as u32,
                bi_x_pels_per_meter: 0,
                bi_y_pels_per_meter: 0,
                bi_clr_used: 0,
                bi_clr_important: 0,
            };

            GetDIBits(
                hdc_mem,
                hbm,
                0,
                out_h as u32,
                bmp[54..].as_mut_ptr(),
                &mut bih,
                0,
            );

            // Copy updated 40-byte BITMAPINFOHEADER into bmp[14..54]
            let bih_bytes: &[u8] =
                std::slice::from_raw_parts((&bih as *const BitmapInfoHeader) as *const u8, 40);
            bmp[14..54].copy_from_slice(bih_bytes);

            SelectObject(hdc_mem, old_obj);
            DeleteObject(hbm);
            DeleteDC(hdc_mem);
            ReleaseDC(0, hdc_screen);

            let b64 = base64_encode(&bmp);
            return Ok(format!("data:image/bmp;base64,{}", b64));
        }
    }

    #[cfg(target_os = "macos")]
    {
        #[link(name = "CoreGraphics", kind = "framework")]
        extern "C" {
            fn CGPreflightScreenCaptureAccess() -> bool;
        }

        unsafe {
            if !CGPreflightScreenCaptureAccess() {
                return Err("screen_capture_permission_not_granted".to_string());
            }
        }

        let tmp_path = format!("/tmp/bidesk_capture_{}.jpg", disp_idx);
        let status = std::process::Command::new("/usr/sbin/screencapture")
            .args([
                "-x",
                "-C",
                "-t",
                "jpg",
                "-D",
                &disp_idx.to_string(),
                &tmp_path,
            ])
            .status()
            .map_err(|e| e.to_string())?;

        if !status.success() {
            return Err("screencapture failed".to_string());
        }

        let bytes = std::fs::read(&tmp_path).map_err(|e| e.to_string())?;
        let _ = std::fs::remove_file(&tmp_path);
        if bytes.is_empty() {
            return Err("empty capture".to_string());
        }
        let b64 = base64_encode(&bytes);
        return Ok(format!("data:image/jpeg;base64,{}", b64));
    }

    #[allow(unreachable_code)]
    Err("Unsupported platform".to_string())
}

#[tauri::command]
fn execute_remote_input(
    input_type: String,
    x: Option<f64>,
    y: Option<f64>,
    button: Option<u32>,
    key: Option<String>,
    code: Option<String>,
) {
    #[cfg(target_os = "windows")]
    {
        #[link(name = "user32")]
        extern "system" {
            fn SetCursorPos(X: i32, Y: i32) -> i32;
            fn mouse_event(dwFlags: u32, dx: u32, dy: u32, dwData: u32, dwExtraInfo: usize);
            fn GetSystemMetrics(nIndex: i32) -> i32;
            fn keybd_event(bVk: u8, bScan: u8, dwFlags: u32, dwExtraInfo: usize);
        }
        const SM_CXSCREEN: i32 = 0;
        const SM_CYSCREEN: i32 = 1;
        const MOUSEEVENTF_LEFTDOWN: u32 = 0x0002;
        const MOUSEEVENTF_LEFTUP: u32 = 0x0004;
        const MOUSEEVENTF_RIGHTDOWN: u32 = 0x0008;
        const MOUSEEVENTF_RIGHTUP: u32 = 0x0010;
        const MOUSEEVENTF_MIDDLEDOWN: u32 = 0x0020;
        const MOUSEEVENTF_MIDDLEUP: u32 = 0x0040;
        const KEYEVENTF_KEYUP: u32 = 0x0002;

        fn map_js_key_to_vk(key_str: &str, code_str: &str) -> u8 {
            match key_str {
                "Enter" => 0x0D,
                "Backspace" => 0x08,
                "Tab" => 0x09,
                " " | "Spacebar" => 0x20,
                "Escape" => 0x1B,
                "ArrowLeft" => 0x25,
                "ArrowUp" => 0x26,
                "ArrowRight" => 0x27,
                "ArrowDown" => 0x28,
                "Delete" => 0x2E,
                "Shift" => 0x10,
                "Control" => 0x11,
                "Alt" => 0x12,
                _ => {
                    if key_str.len() == 1 {
                        let ch = key_str.chars().next().unwrap_or('\0').to_ascii_uppercase();
                        if ch.is_ascii_alphanumeric() {
                            return ch as u8;
                        }
                    }
                    if code_str.starts_with("Key") && code_str.len() == 4 {
                        return code_str.as_bytes()[3];
                    }
                    if code_str.starts_with("Digit") && code_str.len() == 6 {
                        return code_str.as_bytes()[5];
                    }
                    0
                }
            }
        }

        unsafe {
            match input_type.as_str() {
                "mousemove" => {
                    if let (Some(px), Some(py)) = (x, y) {
                        let screen_w = GetSystemMetrics(SM_CXSCREEN);
                        let screen_h = GetSystemMetrics(SM_CYSCREEN);
                        if screen_w > 0 && screen_h > 0 {
                            let target_x = ((px / 1920.0) * screen_w as f64) as i32;
                            let target_y = ((py / 1080.0) * screen_h as f64) as i32;
                            SetCursorPos(target_x, target_y);
                        }
                    }
                }
                "mousedown" => {
                    if let (Some(px), Some(py)) = (x, y) {
                        let screen_w = GetSystemMetrics(SM_CXSCREEN);
                        let screen_h = GetSystemMetrics(SM_CYSCREEN);
                        if screen_w > 0 && screen_h > 0 {
                            SetCursorPos(
                                ((px / 1920.0) * screen_w as f64) as i32,
                                ((py / 1080.0) * screen_h as f64) as i32,
                            );
                        }
                    }
                    let flag = match button.unwrap_or(0) {
                        0 => MOUSEEVENTF_LEFTDOWN,
                        1 => MOUSEEVENTF_MIDDLEDOWN,
                        2 => MOUSEEVENTF_RIGHTDOWN,
                        _ => MOUSEEVENTF_LEFTDOWN,
                    };
                    mouse_event(flag, 0, 0, 0, 0);
                }
                "mouseup" => {
                    let flag = match button.unwrap_or(0) {
                        0 => MOUSEEVENTF_LEFTUP,
                        1 => MOUSEEVENTF_MIDDLEUP,
                        2 => MOUSEEVENTF_RIGHTUP,
                        _ => MOUSEEVENTF_LEFTUP,
                    };
                    mouse_event(flag, 0, 0, 0, 0);
                }
                "keydown" => {
                    let k = key.as_deref().unwrap_or("");
                    let c = code.as_deref().unwrap_or("");
                    let vk = map_js_key_to_vk(k, c);
                    if vk > 0 {
                        keybd_event(vk, 0, 0, 0);
                    }
                }
                "keyup" => {
                    let k = key.as_deref().unwrap_or("");
                    let c = code.as_deref().unwrap_or("");
                    let vk = map_js_key_to_vk(k, c);
                    if vk > 0 {
                        keybd_event(vk, 0, KEYEVENTF_KEYUP, 0);
                    }
                }
                _ => {}
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        #[repr(C)]
        #[derive(Copy, Clone)]
        struct CGPoint {
            x: f64,
            y: f64,
        }

        #[link(name = "CoreGraphics", kind = "framework")]
        extern "C" {
            fn CGMainDisplayID() -> u32;
            fn CGDisplayPixelsWide(display: u32) -> usize;
            fn CGDisplayPixelsHigh(display: u32) -> usize;
            fn CGEventCreateMouseEvent(
                source: *const std::ffi::c_void,
                mouseType: u32,
                mouseCursorPosition: CGPoint,
                mouseButton: u32,
            ) -> *mut std::ffi::c_void;
            fn CGEventPost(tap: u32, event: *mut std::ffi::c_void);
        }

        #[link(name = "CoreFoundation", kind = "framework")]
        extern "C" {
            fn CFRelease(cf: *const std::ffi::c_void);
        }

        const K_CG_EVENT_LEFT_MOUSE_DOWN: u32 = 1;
        const K_CG_EVENT_LEFT_MOUSE_UP: u32 = 2;
        const K_CG_EVENT_RIGHT_MOUSE_DOWN: u32 = 3;
        const K_CG_EVENT_RIGHT_MOUSE_UP: u32 = 4;
        const K_CG_EVENT_MOUSE_MOVED: u32 = 5;
        const K_CG_HID_EVENT_TAP: u32 = 0;

        unsafe {
            let main_id = CGMainDisplayID();
            let screen_w = CGDisplayPixelsWide(main_id).max(1280) as f64;
            let screen_h = CGDisplayPixelsHigh(main_id).max(720) as f64;

            if let (Some(px), Some(py)) = (x, y) {
                let pt = CGPoint {
                    x: (px / 1920.0) * screen_w,
                    y: (py / 1080.0) * screen_h,
                };
                let (ev_type, btn) = match input_type.as_str() {
                    "mousemove" => (K_CG_EVENT_MOUSE_MOVED, 0),
                    "mousedown" => {
                        if button.unwrap_or(0) == 2 {
                            (K_CG_EVENT_RIGHT_MOUSE_DOWN, 1)
                        } else {
                            (K_CG_EVENT_LEFT_MOUSE_DOWN, 0)
                        }
                    }
                    "mouseup" => {
                        if button.unwrap_or(0) == 2 {
                            (K_CG_EVENT_RIGHT_MOUSE_UP, 1)
                        } else {
                            (K_CG_EVENT_LEFT_MOUSE_UP, 0)
                        }
                    }
                    _ => return,
                };
                let ev = CGEventCreateMouseEvent(std::ptr::null(), ev_type, pt, btn);
                if !ev.is_null() {
                    CGEventPost(K_CG_HID_EVENT_TAP, ev);
                    CFRelease(ev);
                }
            }
        }
        let _ = (key, code);
    }
}

fn main() {
    tauri::Builder::default()
        .on_permission_request(|_webview, _kind| PermissionResponse::Allow)
        .invoke_handler(tauri::generate_handler![
            execute_remote_input,
            get_physical_displays,
            capture_desktop_frame
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
