import Cleave from "cleave.js";
import { Directive } from "vue";
import { CleaveInternalOptions, HTMLCleaveElement } from "@/types";

export const vCleave: Directive<HTMLCleaveElement, CleaveInternalOptions> = {
  mounted(el, binding) {
    el.cleave = new Cleave(el, {
      delimiterLazyShow: true,
      rawValueTrimPrefix: true,
      ...(binding.value || { numeralDecimalScale: 0 })
    });

    if (binding.value.initValue) {
      el.cleave.setRawValue(binding.value.initValue);
    }
  },
  unmounted(el) {
    el.cleave.destroy();
  },
  updated(el, binding) {
    el.cleave.destroy();

    el.cleave = new Cleave(el, {
      delimiterLazyShow: true,
      rawValueTrimPrefix: true,
      ...(binding.value || { numeralDecimalScale: 0 })
    });
  }
};
