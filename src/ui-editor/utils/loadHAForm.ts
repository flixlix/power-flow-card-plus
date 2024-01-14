export const loadHaForm = async () => {
  if (!customElements.get("ha-form")) {
    (customElements.get("hui-button-card") as any)?.getConfigElement();
  }
  if (!customElements.get("ha-entity-picker")) {
    (customElements.get("hui-entities-card") as any)?.getConfigElement();
  }
  if (customElements.get("ha-form")) return;

  const helpers = await (window as any).loadCardHelpers?.();

  if (!helpers) return;
};
