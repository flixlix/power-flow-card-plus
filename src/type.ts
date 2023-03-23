export type ComboEntity = {
  consumption?: string;
  production?: string;
};

export type EntityType =
  | "battery"
  | "individual2"
  | "grid"
  | "solar"
  | "individual1";
