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
};

export type EntityType =
  | "battery"
  | "grid"
  | "solar"
  | "individual1"
  | "individual2";
