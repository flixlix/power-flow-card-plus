export type ComboEntity = {
  consumption: string;
  production: string;
};

export type IndividualDeviceType = {
  entity: string;
  name?: string;
  icon?: string;
  color?: string;
  color_icon?: boolean;
  display_zero?: boolean;
  inverted_animation?: boolean;
  unit_of_measurement?: string;
  secondary_info?: {
    entity: string;
    unit_of_measurement?: string;
    icon?: string;
    display_zero?: boolean;
    unit_white_space?: boolean;
  };
};

export type EntityType =
  | "battery"
  | "grid"
  | "solar"
  | "individual1"
  | "individual1Secondary"
  | "individual2"
  | "individual2Secondary";
