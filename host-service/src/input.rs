use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type", content = "payload")]
pub enum InputEvent {
    #[serde(rename = "mouse")]
    Mouse {
        x: i32,
        y: i32,
        button: Option<u8>,
        action: String, // "down", "up", "move"
    },
    #[serde(rename = "keyboard")]
    Keyboard {
        key_code: u32,
        state: String, // "down", "up"
    },
    #[serde(rename = "gamepad")]
    Gamepad {
        slot: u8,
        buttons: u16,
        thumb_lx: i16,
        thumb_ly: i16,
        thumb_rx: i16,
        thumb_ry: i16,
        trigger_l: u8,
        trigger_r: u8,
    },
}

pub struct InputDispatcher;

impl InputDispatcher {
    pub fn dispatch(event: &InputEvent) {
        match event {
            InputEvent::Mouse { x, y, button, action } => {
                #[cfg(windows)]
                {
                    // Windows SendInput / SendMessage hook
                }
                #[cfg(target_os = "macos")]
                {
                    // macOS CGEventPost hook
                }
                log::trace!("[INPUT] Mouse Event: action={}, pos=({}, {}), btn={:?}", action, x, y, button);
            }
            InputEvent::Keyboard { key_code, state } => {
                log::trace!("[INPUT] Keyboard Event: code={}, state={}", key_code, state);
            }
            InputEvent::Gamepad { slot, buttons, .. } => {
                // ViGEmBus Emulation Slot (Xbox 360 / PS4)
                log::trace!("[INPUT] ViGEmBus Gamepad Slot {}: btn_mask={:#x}", slot, buttons);
            }
        }
    }
}
