import {useLayoutEffect, useRef} from "react";

const COUNTER_MIRROR = " scale(-1,1)";

/** Nivo Calendar has no RTL layout option. Mirror geometry, then counter-mirror
 * each label in its existing local coordinates so glyphs remain readable.
 * Observe Nivo's responsive layout updates without replacing its tooltips/data.
 */
export function useRtlCalendar(rtl: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const container = ref.current;
    if (!container || !rtl) return;
    const update = () => {
      container.querySelectorAll("svg text").forEach(text => {
        const transform = text.getAttribute("transform") ?? "";
        if (!transform.endsWith(COUNTER_MIRROR)) text.setAttribute("transform", transform + COUNTER_MIRROR);
      });
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(container, {subtree: true, childList: true, attributes: true, attributeFilter: ["transform"]});
    return () => {
      observer.disconnect();
      container.querySelectorAll("svg text").forEach(text => {
        const transform = text.getAttribute("transform") ?? "";
        if (transform.endsWith(COUNTER_MIRROR)) text.setAttribute("transform", transform.slice(0, -COUNTER_MIRROR.length));
      });
    };
  }, [rtl]);
  return ref;
}
