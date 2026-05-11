import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { trpc } from "@/lib/trpc";
import Layout from "@/components/Layout";

// ─── Responsive D3 Bar Chart ──────────────────────────────────────────────────
function PostsPerMonthChart({ data }: { data: Array<{ month: string; count: number }> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 300;
    const margin = { top: 20, right: 16, bottom: 40, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", 220);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand().domain(data.map((d) => d.month)).range([0, width]).padding(0.25);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.count) || 10]).nice().range([height, 0]);

    const defs = svg.append("defs");
    const gradient = defs.append("linearGradient").attr("id", "barGrad").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    gradient.append("stop").attr("offset", "0%").attr("stop-color", "oklch(0.55 0.22 264)").attr("stop-opacity", 1);
    gradient.append("stop").attr("offset", "100%").attr("stop-color", "oklch(0.6 0.2 290)").attr("stop-opacity", 0.7);

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""))
      .selectAll("line").style("stroke", "#e5e7eb").style("stroke-dasharray", "3,3");
    g.select(".grid .domain").remove();

    g.selectAll(".bar").data(data).enter().append("rect")
      .attr("x", (d) => x(d.month) || 0).attr("y", height).attr("width", x.bandwidth()).attr("height", 0).attr("rx", 5).attr("fill", "url(#barGrad)")
      .transition().duration(700).delay((_, i) => i * 50)
      .attr("y", (d) => y(d.count)).attr("height", (d) => height - y(d.count));

    g.selectAll(".label").data(data).enter().append("text")
      .attr("x", (d) => (x(d.month) || 0) + x.bandwidth() / 2).attr("y", (d) => y(d.count) - 5)
      .attr("text-anchor", "middle").attr("font-size", "10px").attr("fill", "oklch(0.55 0.22 264)").attr("font-weight", "600")
      .text((d) => d.count);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x))
      .selectAll("text").attr("font-size", "10px").attr("fill", "#6b7280");
    g.append("g").call(d3.axisLeft(y).ticks(4))
      .selectAll("text").attr("font-size", "10px").attr("fill", "#6b7280");
    g.selectAll(".domain").style("stroke", "#e5e7eb");
    g.selectAll(".tick line").style("stroke", "#e5e7eb");
  }, [data]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg ref={svgRef} style={{ minWidth: 280 }} />
    </div>
  );
}

// ─── Responsive D3 Line Chart ─────────────────────────────────────────────────
function UserActivityChart({ data }: { data: Array<{ month: string; newUsers: number }> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 300;
    const margin = { top: 20, right: 16, bottom: 40, left: 40 };
    const width = containerWidth - margin.left - margin.right;
    const height = 220 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", 220);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scalePoint().domain(data.map((d) => d.month)).range([0, width]).padding(0.5);
    const y = d3.scaleLinear().domain([0, d3.max(data, (d) => d.newUsers) || 10]).nice().range([height, 0]);

    const defs = svg.append("defs");
    const areaGrad = defs.append("linearGradient").attr("id", "areaGrad2").attr("x1", "0%").attr("y1", "0%").attr("x2", "0%").attr("y2", "100%");
    areaGrad.append("stop").attr("offset", "0%").attr("stop-color", "oklch(0.6 0.2 290)").attr("stop-opacity", 0.3);
    areaGrad.append("stop").attr("offset", "100%").attr("stop-color", "oklch(0.6 0.2 290)").attr("stop-opacity", 0.02);

    g.append("g").attr("class", "grid").call(d3.axisLeft(y).tickSize(-width).tickFormat(() => ""))
      .selectAll("line").style("stroke", "#e5e7eb").style("stroke-dasharray", "3,3");
    g.select(".grid .domain").remove();

    const area = d3.area<{ month: string; newUsers: number }>()
      .x((d) => x(d.month) || 0).y0(height).y1((d) => y(d.newUsers)).curve(d3.curveCatmullRom);
    g.append("path").datum(data).attr("fill", "url(#areaGrad2)").attr("d", area);

    const line = d3.line<{ month: string; newUsers: number }>()
      .x((d) => x(d.month) || 0).y((d) => y(d.newUsers)).curve(d3.curveCatmullRom);
    const path = g.append("path").datum(data).attr("fill", "none").attr("stroke", "oklch(0.6 0.2 290)").attr("stroke-width", 2.5).attr("d", line);
    const totalLength = (path.node() as SVGPathElement)?.getTotalLength() || 0;
    path.attr("stroke-dasharray", `${totalLength} ${totalLength}`).attr("stroke-dashoffset", totalLength)
      .transition().duration(1000).ease(d3.easeLinear).attr("stroke-dashoffset", 0);

    g.selectAll(".dot").data(data).enter().append("circle")
      .attr("cx", (d) => x(d.month) || 0).attr("cy", (d) => y(d.newUsers)).attr("r", 0)
      .attr("fill", "oklch(0.6 0.2 290)").attr("stroke", "white").attr("stroke-width", 2)
      .transition().delay((_, i) => i * 80 + 800).duration(300).attr("r", 4);

    g.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x))
      .selectAll("text").attr("font-size", "10px").attr("fill", "#6b7280");
    g.append("g").call(d3.axisLeft(y).ticks(4))
      .selectAll("text").attr("font-size", "10px").attr("fill", "#6b7280");
    g.selectAll(".domain").style("stroke", "#e5e7eb");
    g.selectAll(".tick line").style("stroke", "#e5e7eb");
  }, [data]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg ref={svgRef} style={{ minWidth: 280 }} />
    </div>
  );
}

// ─── Responsive Horizontal Bar Chart ─────────────────────────────────────────
function GroupPostStatsChart({ data }: { data: Array<{ groupName: string; postCount: number }> }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data.length || !svgRef.current || !containerRef.current) return;

    const containerWidth = containerRef.current.clientWidth || 300;
    const margin = { top: 10, right: 50, bottom: 10, left: Math.min(120, containerWidth * 0.35) };
    const width = containerWidth - margin.left - margin.right;
    const height = Math.max(data.length * 38, 100);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("width", containerWidth).attr("height", height + margin.top + margin.bottom);

    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const y = d3.scaleBand().domain(data.map((d) => d.groupName)).range([0, height]).padding(0.3);
    const x = d3.scaleLinear().domain([0, d3.max(data, (d) => d.postCount) || 10]).nice().range([0, width]);

    const colors = ["oklch(0.55 0.22 264)", "oklch(0.6 0.2 290)", "oklch(0.65 0.18 310)", "oklch(0.58 0.2 250)", "oklch(0.5 0.22 264)"];

    g.selectAll(".bar").data(data).enter().append("rect")
      .attr("y", (d) => y(d.groupName) || 0).attr("x", 0).attr("height", y.bandwidth()).attr("width", 0).attr("rx", 5)
      .attr("fill", (_, i) => colors[i % colors.length])
      .transition().duration(600).delay((_, i) => i * 70).attr("width", (d) => x(d.postCount));

    g.selectAll(".label").data(data).enter().append("text")
      .attr("y", (d) => (y(d.groupName) || 0) + y.bandwidth() / 2 + 4)
      .attr("x", (d) => x(d.postCount) + 5).attr("font-size", "11px").attr("fill", "#6b7280").attr("font-weight", "600")
      .text((d) => d.postCount);

    g.append("g").call(d3.axisLeft(y)).selectAll("text").attr("font-size", "11px").attr("fill", "#374151");
    g.selectAll(".domain").remove();
    g.selectAll(".tick line").remove();
  }, [data]);

  return (
    <div ref={containerRef} className="w-full overflow-x-auto">
      <svg ref={svgRef} style={{ minWidth: 260 }} />
    </div>
  );
}

export default function Stats() {
  const { data: postsPerMonth } = trpc.stats.postsPerMonth.useQuery();
  const { data: userActivity } = trpc.stats.userActivity.useQuery();
  const { data: groupStats } = trpc.stats.groupPostStats.useQuery();
  const { data: totals } = trpc.stats.totals.useQuery();

  const statCards = [
    { label: "Users", value: totals?.users || 0, icon: "👥", color: "oklch(0.55 0.22 264)" },
    { label: "Posts", value: totals?.posts || 0, icon: "📝", color: "oklch(0.6 0.2 290)" },
    { label: "Groups", value: totals?.groups || 0, icon: "🏘️", color: "oklch(0.65 0.18 310)" },
    { label: "Messages", value: totals?.messages || 0, icon: "💬", color: "oklch(0.58 0.2 250)" },
  ];

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-xl sm:text-2xl font-bold mb-1" style={{ fontFamily: "'SocialNetDisplay', 'Playfair Display', serif" }}>
          Platform Statistics
        </h1>
        <p className="text-muted-foreground mb-6 text-sm">Live data from MongoDB, visualized with D3.js</p>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {statCards.map((s) => (
            <div key={s.label} className="sn-card p-4 fade-in">
              <div className="text-2xl mb-1">{s.icon}</div>
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: s.color }}>{s.value.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div className="sn-card p-4 sm:p-6">
            <h2 className="font-semibold mb-1 text-sm">Posts Per Month</h2>
            <p className="text-xs text-muted-foreground mb-3">Monthly post activity</p>
            {postsPerMonth && postsPerMonth.length > 0 ? (
              <PostsPerMonthChart data={postsPerMonth.map((d: any) => ({ month: d.month, count: Number(d.count) }))} />
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>

          <div className="sn-card p-4 sm:p-6">
            <h2 className="font-semibold mb-1 text-sm">User Growth</h2>
            <p className="text-xs text-muted-foreground mb-3">New registrations per month</p>
            {userActivity && userActivity.length > 0 ? (
              <UserActivityChart data={userActivity.map((d: any) => ({ month: d.month, newUsers: Number(d.newUsers) }))} />
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </div>
        </div>

        <div className="sn-card p-4 sm:p-6">
          <h2 className="font-semibold mb-1 text-sm">Posts by Group</h2>
          <p className="text-xs text-muted-foreground mb-3">Most active groups</p>
          {groupStats && groupStats.length > 0 ? (
            <GroupPostStatsChart data={groupStats.map((d: any) => ({ groupName: d.groupName, postCount: Number(d.postCount) }))} />
          ) : (
            <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
          )}
        </div>
      </div>
    </Layout>
  );
}
