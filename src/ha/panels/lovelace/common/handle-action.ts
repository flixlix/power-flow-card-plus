import { ActionConfig, HomeAssistant } from "custom-card-helpers";
import { fireEvent } from "@/ha/common/dom/fire_event";

export type ActionConfigParams = {
  entity?: string;
  camera_image?: string;
  hold_action?: ActionConfig;
  tap_action?: ActionConfig;
  double_tap_action?: ActionConfig;
};

export const handleAction = async (node: HTMLElement, _hass: HomeAssistant, config: ActionConfigParams, action: string): Promise<void> => {
  fireEvent(node, "hass-action", { config, action });
};

type ActionParams = { config: ActionConfigParams; action: string };

declare global {
  interface HASSDomEvents {
    "hass-action": ActionParams;
  }
}
