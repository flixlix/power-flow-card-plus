export type ComboEntity = {
  consumption?: string;
  production?: string;
};

export type EntityType =
  | "battery"
  | "grid"
  | "solar"
  | "individual1"
  | "individual2";
