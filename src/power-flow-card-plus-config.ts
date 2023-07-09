import { LovelaceCardConfig } from "custom-card-helpers";
import { ComboEntity, IndividualDeviceType, SecondaryInfoType, baseConfigEntity, gridPowerOutage } from "./type.js";

interface mainConfigOptions {
  dashboard_link?: string;
  dashboard_link_label?: string;
  second_dashboard_link?: string;
  second_dashboard_link_label?: string;
  kw_decimals: number;
  min_flow_rate: number;
  max_flow_rate: number;
  w_decimals: number;
  watt_threshold: number;
  clickable_entities: boolean;
  max_expected_power: number;
  min_expected_power: number;
  use_new_flow_rate_model?: boolean;
  full_size?: boolean;
  style_ha_card?: any;
  style_card_content?: any;
  display_zero_lines?: {
    mode?: string;
    transparency?: number;
    grey_color?: string | number[];
  };
}
export interface PowerFlowCardPlusConfig extends LovelaceCardConfig, mainConfigOptions {
  entities: {
    battery?: baseConfigEntity & {
      state_of_charge?: string;
      state_of_charge_unit?: string;
      state_of_charge_unit_white_space?: boolean;
      state_of_charge_decimals?: number;
      color_state_of_charge_value?: boolean | "production" | "consumption";
      color_circle: boolean | "production" | "consumption";
      color?: ComboEntity;
    };
    grid?: baseConfigEntity & {
      power_outage: gridPowerOutage;
      secondary_info?: SecondaryInfoType;
      color_circle: boolean | "production" | "consumption";
      color?: ComboEntity;
    };
    solar?: baseConfigEntity & {
      entity: string;
      color?: any;
      color_icon?: boolean;
      color_value?: boolean;
      color_label?: boolean;
      secondary_info?: SecondaryInfoType;
      display_zero_state?: boolean;
    };
    home?: baseConfigEntity & {
      entity: string;
      override_state?: boolean;
      color_icon?: boolean | "solar" | "grid" | "battery";
      color_value?: boolean | "solar" | "grid" | "battery";
      subtract_individual?: boolean;
      secondary_info?: SecondaryInfoType;
    };
    fossil_fuel_percentage?: baseConfigEntity & {
      entity: string;
      color?: string;
      state_type?: "percentage" | "power";
      color_icon?: boolean;
      display_zero?: boolean;
      display_zero_state?: boolean;
      display_zero_tolerance?: number;
      color_value?: boolean;
      color_label?: boolean;
      unit_white_space?: boolean;
      calculate_flow_rate?: boolean | number;
      seconday_info: SecondaryInfoType;
    };
    individual1?: IndividualDeviceType;
    individual2?: IndividualDeviceType;
  };
}
