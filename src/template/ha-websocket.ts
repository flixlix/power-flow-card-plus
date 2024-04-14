import { UnsubscribeFunc } from "home-assistant-js-websocket";

interface TemplateListeners {
  all: boolean;
  domains: string[];
  entities: string[];
  time: boolean;
}
export interface RenderTemplateResult {
  result: string;
  listeners: TemplateListeners;
}

export const subscribeRenderTemplate = (
  conn: any,
  onChange: (result: RenderTemplateResult) => void,
  params: {
    template: string;
    entity_ids?: string | string[];
    variables?: Record<string, unknown>;
    timeout?: number;
    strict?: boolean;
  }
): Promise<UnsubscribeFunc> =>
  conn.subscribeMessage((msg: RenderTemplateResult) => onChange(msg), {
    type: "render_template",
    ...params,
  });
