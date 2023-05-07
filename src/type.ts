export type ComboEntity = {
  consumption: string;
  production: string;
};

export type SecondaryInfoType = {
  entity?: string;
  unit_of_measurement?: string;
  icon?: string;
  display_zero?: boolean;
  unit_white_space?: boolean;
  display_zero_tolerance?: number;
  color_value?: boolean | "production" | "consumption";
  template?: string;
};

export interface baseConfigEntity {
  entity: string | ComboEntity;
  name?: string;
  icon?: string;
  color?: ComboEntity | string;
  color_icon?: boolean | string;
  display_state?: "two_way" | "one_way" | "one_way_no_zero";
  display_zero_tolerance?: number;
  unit_of_measurement?: string;
  use_metadata?: boolean;
  secondary_info?: SecondaryInfoType;
}

export type gridPowerOutage = {
  entity: string;
  state_alert?: string;
  label_alert?: string;
  icon_alert?: string;
};

export type IndividualDeviceType = {
  entity: string;
  name?: string;
  icon?: string;
  color?: string;
  color_icon?: boolean;
  inverted_animation?: boolean;
  unit_of_measurement?: string;
  display_zero?: boolean;
  display_zero_state?: boolean;
  display_zero_tolerance?: number;
  secondary_info?: SecondaryInfoType;
  color_value?: boolean;
  color_label?: boolean;
  calculate_flow_rate?: boolean;
  use_metadata?: boolean;
};

export type EntityType =
  | "battery"
  | "grid"
  | "solar"
  | "individual1"
  | "individual1Secondary"
  | "individual2"
  | "individual2Secondary"
  | "solarSecondary"
  | "homeSecondary"
  | "gridSecondary"
  | "nonFossilSecondary";
