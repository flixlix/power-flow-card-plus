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
  decimals?: number;
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
  unit_white_space?: boolean;
  use_metadata?: boolean;
  secondary_info?: SecondaryInfoType;
  invert_state?: boolean;
}

export type GridPowerOutage = {
  entity: string;
  state_alert?: string;
  label_alert?: string;
  icon_alert?: string;
  entity_generator?: string;
};

export type IndividualDeviceType = baseConfigEntity & {
  entity: string;
  color?: string;
  color_icon?: boolean;
  inverted_animation?: boolean;
  display_zero?: boolean;
  display_zero_state?: boolean;
  color_value?: boolean;
  color_label?: boolean;
  calculate_flow_rate?: boolean;
  use_metadata?: boolean;
  decimals?: number;
  show_direction?: boolean;
};

export type EntityType = "battery" | "grid" | "solar" | "individual1" | "individual2" | "home" | "fossil_fuel_percentage";

export type TemplatesObj = {
  gridSecondary: string | undefined;
  solarSecondary: string | undefined;
  homeSecondary: string | undefined;
  individual1Secondary: string | undefined;
  individual2Secondary: string | undefined;
  nonFossilFuelSecondary: string | undefined;
};

export type HomeSources = {
  battery: {
    value: number;
    color: string;
  };
  solar: {
    value: number;
    color: string;
  };
  grid: {
    value: number;
    color: string;
  };
  gridNonFossil: {
    value: number;
    color: string;
  };
};

export type NewDur = {
  batteryGrid: number;
  batteryToHome: number;
  gridToHome: number;
  solarToBattery: number;
  solarToGrid: number;
  solarToHome: number;
  individual1: number;
  individual2: number;
  nonFossil: number;
};
