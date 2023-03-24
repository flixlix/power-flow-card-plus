export type ComboEntity = {
  consumption?: string;
  production?: string;
  entity?: string;
  name?: string;
  icon?: string;
  color?: string;
};

export type EntityType =
  | "battery"
  | "grid"
  | "solar"
  | "individual1"
  | "individual2";
