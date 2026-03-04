import { ConfigEntities } from "@/power-flow-card-plus-config";

export type ConfigPage = keyof ConfigEntities | "grid_house" | "grid_main" | "intermediate" | "advanced" | null;
