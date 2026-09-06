export function initClusters(signal: AbortSignal) {
  document
    .querySelectorAll<HTMLElement>("[data-team-clusters]")
    .forEach((root) => {
      const clusters = [
        ...root.querySelectorAll<HTMLElement>("[data-team-cluster]"),
      ];
      let picked: HTMLElement | undefined;
      function name(cluster: HTMLElement, index?: string) {
        cluster
          .querySelectorAll<HTMLElement>("[data-member-label]")
          .forEach((label) => {
            label.hidden = label.dataset.memberLabel !== index;
          });
      }
      function clear() {
        picked?.removeAttribute("data-picked");
        picked = undefined;
        clusters.forEach((cluster) => {
          cluster.removeAttribute("data-open");
          cluster
            .querySelector("[data-cluster-toggle]")
            ?.setAttribute("aria-expanded", "false");
          name(cluster);
        });
      }
      clusters.forEach((cluster) => {
        cluster.querySelector("[data-cluster-toggle]")?.addEventListener(
          "click",
          () => {
            const open = cluster.hasAttribute("data-open");
            clear();
            cluster.toggleAttribute("data-open", !open);
            cluster
              .querySelector("[data-cluster-toggle]")
              ?.setAttribute("aria-expanded", String(!open));
          },
          { signal },
        );
        cluster
          .querySelectorAll<HTMLElement>("[data-team-face]")
          .forEach((face) => {
            face.addEventListener(
              "pointerenter",
              (event) => {
                if (event.pointerType === "mouse")
                  name(cluster, face.dataset.teamFace);
              },
              { signal },
            );
            face.addEventListener(
              "focusin",
              () => name(cluster, face.dataset.teamFace),
              { signal },
            );
            face.querySelector("a")?.addEventListener(
              "click",
              (event) => {
                if (matchMedia("(hover: hover)").matches) return;
                event.preventDefault();
                const previous = picked;
                picked?.removeAttribute("data-picked");
                clusters.forEach((item) => name(item));
                picked = previous === face ? undefined : face;
                picked?.setAttribute("data-picked", "");
                name(cluster, picked?.dataset.teamFace);
              },
              { signal },
            );
          });
        cluster.addEventListener(
          "pointerleave",
          () =>
            name(
              cluster,
              picked && cluster.contains(picked)
                ? picked.dataset.teamFace
                : undefined,
            ),
          { signal },
        );
      });
      document.addEventListener(
        "pointerdown",
        (event) => {
          if (!root.contains(event.target as Node)) clear();
        },
        { signal },
      );
    });
}
