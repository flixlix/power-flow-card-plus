export type ComboEntity = {
  consumption: string;
  production: string;
};

export type Bubble = {
  entity: string | ComboEntity;
  name?: string;
  icon?: string;
  color?: string;
  color_icon?: string;
  display_zero?: boolean;
  state_type?: "percentage" | "power";
};

export type EntityType =
  | "battery"
  | "grid"
  | "solar"
  | "individual1"
  | "individual2";
