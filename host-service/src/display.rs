use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualDisplayConfig {
    pub display_id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub refresh_rate: u32,
    pub hdr_10bit: bool,
    pub is_virtual: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ColorPrecision {
    EightBitSDR,
    TenBitHDR, // 10-bit Rec.2020 / HDR10 / YUV 4:4:4 10-bit
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DisplayManager {
    pub active_displays: Vec<VirtualDisplayConfig>,
    pub primary_display_id: u32,
    pub color_mode: ColorPrecision,
}

#[allow(dead_code)]
impl DisplayManager {
    pub fn new() -> Self {
        let default_screen = VirtualDisplayConfig {
            display_id: 1,
            name: "Display 1 (Primary)".to_string(),
            width: 2560,
            height: 1440,
            refresh_rate: 144,
            hdr_10bit: true,
            is_virtual: false,
        };

        Self {
            active_displays: vec![default_screen],
            primary_display_id: 1,
            color_mode: ColorPrecision::TenBitHDR,
        }
    }

    pub fn create_virtual_display(&mut self, width: u32, height: u32, hz: u32, hdr: bool) -> VirtualDisplayConfig {
        let new_id = (self.active_displays.len() as u32) + 1;
        let display = VirtualDisplayConfig {
            display_id: new_id,
            name: format!("Bi Virtual Display {}", new_id),
            width,
            height,
            refresh_rate: hz,
            hdr_10bit: hdr,
            is_virtual: true,
        };
        self.active_displays.push(display.clone());
        println!("[DISPLAY] Created Virtual Display #{} ({}x{}@{}Hz, 10-bit HDR: {})", new_id, width, height, hz, hdr);
        display
    }

    pub fn remove_virtual_display(&mut self, display_id: u32) -> bool {
        if let Some(pos) = self.active_displays.iter().position(|d| d.display_id == display_id && d.is_virtual) {
            self.active_displays.remove(pos);
            println!("[DISPLAY] Removed Virtual Display #{}", display_id);
            true
        } else {
            false
        }
    }

    pub fn set_color_mode(&mut self, mode: ColorPrecision) {
        self.color_mode = mode;
        println!("[DISPLAY] Color precision set to: {:?}", self.color_mode);
    }
}
