import FormData from "form-data";
import fs from "node:fs";
import common from "../common/images.mjs";

export default {
  ...common,
  key: "dreamstudio-modify-image",
  name: "Modify Image",
  version: "0.0.1",
  description: "Modify an image based on a text prompt. [See the documentation](https://platform.stability.ai/docs/api-reference#tag/v1generation/operation/imageToImage)",
  type: "action",
  props: {
    ...common.props,
    textPrompts: {
      propDefinition: [
        common.props.dreamstudio,
        "textPrompts",
      ],
    },
    initImage: {
      type: "string",
      label: "Init Image",
      description: "Image used to initialize the diffusion process, in lieu of random noise. It must be the path to the image file saved to the `/tmp` directory (e.g. `/tmp/image.png`). [see docs here](https://pipedream.com/docs/workflows/steps/code/nodejs/working-with-files/#the-tmp-directory).",
    },
    initImageMode: {
      type: "string",
      label: "Init Image Mode",
      description: "Used to control how much influence the `init image` has on the result.",
      options: [
        "IMAGE_STRENGTH",
        "STEP_SCHEDULE",
      ],
      optional: true,
    },
    stepScheduleStart: {
      type: "string",
      label: "Step Schedule Start",
      description: "Skips a proportion of the start of the diffusion steps, allowing the init_image to influence the final generated image. Lower values will result in more influence from the init_image, while higher values will result in more influence from the diffusion steps. (e.g. a value of `0` would simply return you the init_image, where a value of `1` would return you a completely different image).",
      optional: true,
    },
    stepScheduleEnd: {
      type: "string",
      label: "Step Schedule End",
      description: "Skips a proportion of the end of the diffusion steps, allowing the init_image to influence the final generated image. Lower values will result in more influence from the init_image, while higher values will result in more influence from the diffusion steps.",
      optional: true,
    },
    cfgScale: {
      propDefinition: [
        common.props.dreamstudio,
        "cfgScale",
      ],
      optional: true,
    },
    clipGuidancePreset: {
      propDefinition: [
        common.props.dreamstudio,
        "clipGuidancePreset",
      ],
      optional: true,
    },
    sampler: {
      propDefinition: [
        common.props.dreamstudio,
        "sampler",
      ],
      optional: true,
    },
    samples: {
      propDefinition: [
        common.props.dreamstudio,
        "samples",
      ],
      optional: true,
    },
    seed: {
      propDefinition: [
        common.props.dreamstudio,
        "seed",
      ],
      optional: true,
    },
    steps: {
      propDefinition: [
        common.props.dreamstudio,
        "steps",
      ],
      optional: true,
    },
    stylePreset: {
      propDefinition: [
        common.props.dreamstudio,
        "stylePreset",
      ],
      optional: true,
    },
    extras: {
      propDefinition: [
        common.props.dreamstudio,
        "extras",
      ],
      optional: true,
    },
  },
  async run({ $ }) {
    const {
      dreamstudio,
      parsePrompts,
      organizationId,
      engineId,
      textPrompts,
      initImage,
      initImageMode,
      cfgScale,
      clipGuidancePreset,
      stylePreset,
      ...appendData
    } = this;
    const formData = new FormData();

    const parsedPrompts = parsePrompts(textPrompts);
    let i = 0;
    for (const prompt of parsedPrompts) {
      formData.append(`text_prompts[${i}][text]`, prompt.text);
      formData.append(`text_prompts[${i}][weight]`, prompt.weight);
      i++;
    }

    formData.append("init_image", fs.readFileSync(`/tmp/${initImage}`));
    initImageMode && formData.append("init_image_mode", initImageMode);
    cfgScale && formData.append("cfg_scale", cfgScale);
    clipGuidancePreset && formData.append("clip_guidance_preset", clipGuidancePreset);
    stylePreset && formData.append("style_preset", stylePreset);

    for (const [
      label,
      value,
    ] of Object.entries(appendData)) {
      formData.append(label, value.toString());
    }

    const response = await dreamstudio.modifyImage({
      $,
      engineId,
      headers: {
        organization: organizationId,
        ...formData.getHeaders(),
      },
      data: formData,
    });

    const paths = await this.writeImg(response.artifacts);

    $.export("$summary", `The image was successfully modified and sent to ${paths.toString()}!`);
    return response;
  },
};
