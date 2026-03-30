import memoizeOne from "memoize-one";

const greyColorSchema = {
  name: "grey_color",
  selector: { color_rgb: {} },
};

const transparencySchema = {
  name: "transparency",
  selector: {
    number: {
      min: 0,
      max: 100,
      step: 1,
      mode: "box",
    },
  },
};

const gridCustomSchema = {
  name: "",
  type: "grid",
  column_min_width: "200px",
  schema: [transparencySchema, greyColorSchema],
};

const displayZeroLinesOptionsSchema = (mode: string) => {
  switch (mode) {
    case "grey_out":
      return greyColorSchema;
    case "transparency":
      return transparencySchema;
    case "custom":
      return gridCustomSchema;
    default:
      return [];
  }
};

export const displayZeroLinesSchema = memoizeOne((localize, mode: string) => [
  {
    name: "display_zero_lines",
    type: "grid",
    column_min_width: "400px",
    schema: [
      {
        name: "mode",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              {
                value: "show",
                label: localize("editor.show"),
              },
              {
                value: "hide",
                label: localize("editor.hide"),
              },
              {
                value: "transparency",
                label: localize("editor.transparency"),
              },
              {
                value: "grey_out",
                label: localize("editor.grey_out"),
              },
              {
                value: "custom",
                label: localize("editor.custom"),
              },
            ],
          },
        },
      },
      displayZeroLinesOptionsSchema(mode),
    ],
  },
]);
