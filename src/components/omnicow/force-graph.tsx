import { useEffect, useRef } from "react";
import * as d3 from "d3";
import { CLUSTER_COLORS, type Farmer } from "@/lib/omnicow/data";

export interface GraphFilters {
  visibleClusters: Set<number>;
  edgeMode: "both" | "ward" | "trainer";
  adoptedOnly: boolean;
}

export function ForceGraph({
  farmers,
  filters,
  onSelect,
}: {
  farmers: Farmer[];
  filters: GraphFilters;
  onSelect: (f: Farmer) => void;
}) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();
    const width = ref.current.clientWidth;
    const height = ref.current.clientHeight;

    const nodes = farmers
      .filter((f) => filters.visibleClusters.has(f.cluster))
      .map((f) => ({ ...f, x: width / 2, y: height / 2 }));
    const ids = new Set(nodes.map((n) => n.id));

    const links: { source: string; target: string; kind: "ward" | "trainer" }[] = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j];
        const sameWard = a.ward === b.ward;
        const sameTrainer = a.trainers[0] === b.trainers[0];
        if (sameWard && (filters.edgeMode === "both" || filters.edgeMode === "ward"))
          links.push({ source: a.id, target: b.id, kind: "ward" });
        else if (sameTrainer && (filters.edgeMode === "both" || filters.edgeMode === "trainer"))
          links.push({ source: a.id, target: b.id, kind: "trainer" });
      }
    }
    const trimmed = links.filter((_, i) => i % 3 === 0).filter((l) => ids.has(l.source) && ids.has(l.target));

    const g = svg.append("g");
    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([0.3, 4]).on("zoom", (e) => {
      g.attr("transform", e.transform);
    });
    svg.call(zoom);

    const sim = d3
      .forceSimulation(nodes as d3.SimulationNodeDatum[])
      .force("link", d3.forceLink(trimmed).id((d: any) => d.id).distance(60).strength(0.2))
      .force("charge", d3.forceManyBody().strength(-90))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide(16));

    const link = g
      .append("g")
      .attr("stroke", "var(--border)")
      .attr("stroke-opacity", 0.5)
      .selectAll("line")
      .data(trimmed)
      .join("line")
      .attr("stroke-width", (d) => (d.kind === "trainer" ? 1.5 : 1))
      .attr("stroke-dasharray", (d) => (d.kind === "trainer" ? "3 3" : null));

    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => 4 + d.pageRank * 9)
      .attr("fill", (d) => CLUSTER_COLORS[d.cluster % CLUSTER_COLORS.length])
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .attr("opacity", (d) => (filters.adoptedOnly && !d.adopted ? 0.12 : 1))
      .style("cursor", "pointer")
      .on("click", (_e, d) => onSelect(d as Farmer));

    node.append("title").text((d) => `${d.id} · Cluster ${d.cluster} · PR ${d.pageRank.toFixed(2)}`);

    node.call(
      d3
        .drag<SVGCircleElement, any>()
        .on("start", (e, d) => {
          if (!e.active) sim.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on("drag", (e, d) => {
          d.fx = e.x;
          d.fy = e.y;
        })
        .on("end", (e, d) => {
          if (!e.active) sim.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        }) as any,
    );

    sim.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
    });

    (ref.current as any).__reset = () => svg.transition().call(zoom.transform as any, d3.zoomIdentity);

    return () => {
      sim.stop();
    };
  }, [farmers, filters, onSelect]);

  return <svg ref={ref} className="h-full w-full" />;
}
