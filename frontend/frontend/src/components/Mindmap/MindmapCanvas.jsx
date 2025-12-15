// import React, { useMemo } from "react";
// import ReactFlow, {
//   Background,
//   Controls,
//   MiniMap,
// } from "reactflow";
// import "reactflow/dist/style.css";
// import dagre from "dagre";

// const nodeWidth = 180;
// const nodeHeight = 50;

// // Auto layout function
// const getLayoutedElements = (nodes, edges) => {
//   const dagreGraph = new dagre.graphlib.Graph();
//   dagreGraph.setDefaultEdgeLabel(() => ({}));
//   dagreGraph.setGraph({ rankdir: "LR" }); // Left → Right

//   nodes.forEach((node) => {
//     dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
//   });

//   edges.forEach((edge) => {
//     dagreGraph.setEdge(edge.source, edge.target);
//   });

//   dagre.layout(dagreGraph);

//   nodes.forEach((node) => {
//     const pos = dagreGraph.node(node.id);
//     node.position = {
//       x: pos.x - nodeWidth / 2,
//       y: pos.y - nodeHeight / 2,
//     };
//   });

//   return { nodes, edges };
// };

// export default function MindmapCanvas({ data }) {
//   const { nodes, edges } = useMemo(() => {
//     if (!data) return { nodes: [], edges: [] };

//     let nodesArr = [];
//     let edgesArr = [];

//     // Root node
//     nodesArr.push({
//       id: "root",
//       data: { label: data.title },
//       position: { x: 0, y: 0 },
//       style: {
//         background: "#f97316",
//         color: "white",
//         fontWeight: "bold",
//         borderRadius: 8,
//         padding: 10,
//       },
//     });

//     data.nodes.forEach((section, i) => {
//       const sectionId = `section-${i}`;

//       nodesArr.push({
//         id: sectionId,
//         data: { label: section.label },
//         position: { x: 0, y: 0 },
//         style: {
//           background: "#fde68a",
//           borderRadius: 8,
//           padding: 10,
//         },
//       });

//       edgesArr.push({
//         id: `e-root-${sectionId}`,
//         source: "root",
//         target: sectionId,
//         animated: true,
//       });

//       section.children.forEach((child, j) => {
//         const childId = `child-${i}-${j}`;

//         nodesArr.push({
//           id: childId,
//           data: { label: child },
//           position: { x: 0, y: 0 },
//           style: {
//             background: "#fff",
//             border: "1px solid #ddd",
//             borderRadius: 6,
//             padding: 8,
//           },
//         });

//         edgesArr.push({
//           id: `e-${sectionId}-${childId}`,
//           source: sectionId,
//           target: childId,
//         });
//       });
//     });

//     return getLayoutedElements(nodesArr, edgesArr);
//   }, [data]);

//   return (
//     <div className="h-[650px] w-full border rounded-lg overflow-hidden">

//       <ReactFlow
//   nodes={nodes}
//   edges={edges}
//   fitView
//   fitViewOptions={{ padding: 0.3 }}
//   minZoom={0.4}
//   maxZoom={1.5}
// >
//         <MiniMap />
//         <Controls />
//         <Background />
//       </ReactFlow>
//     </div>
//   );
// }



import React, { useMemo } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";

const nodeWidth = 180;
const nodeHeight = 50;

/* -----------------------------
   Auto layout using Dagre
------------------------------ */
const getLayoutedElements = (nodes, edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: "LR" }); // Left → Right

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const pos = dagreGraph.node(node.id);
    node.position = {
      x: pos.x - nodeWidth / 2,
      y: pos.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};

/* -----------------------------
   Mindmap Canvas Component
------------------------------ */
export default function MindmapCanvas({ data }) {
  const { nodes, edges } = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };

    let nodesArr = [];
    let edgesArr = [];

    /* ---------- Root Node ---------- */
    nodesArr.push({
      id: "root",
      data: { label: data.title || "Mindmap" },
      position: { x: 0, y: 0 },
      style: {
        background: "#f97316",
        color: "#fff",
        fontWeight: "bold",
        borderRadius: 8,
        padding: 10,
      },
    });

    /* ---------- Sections ---------- */
    Array.isArray(data.nodes) &&
      data.nodes.forEach((section, i) => {
        const sectionId = `section-${i}`;

        nodesArr.push({
          id: sectionId,
          data: { label: section.label },
          position: { x: 0, y: 0 },
          style: {
            background: "#fde68a",
            borderRadius: 8,
            padding: 10,
            fontWeight: "600",
          },
        });

        edgesArr.push({
          id: `e-root-${sectionId}`,
          source: "root",
          target: sectionId,
          animated: true,
        });

        /* ---------- Children ---------- */
        Array.isArray(section.children) &&
          section.children.forEach((child, j) => {
            const childId = `child-${i}-${j}`;

            // 🔑 FIX: child can be STRING or OBJECT
            const childLabel =
              typeof child === "string"
                ? child
                : child?.label || "Subtopic";

            nodesArr.push({
              id: childId,
              data: { label: childLabel },
              position: { x: 0, y: 0 },
              style: {
                background: "#ffffff",
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: 8,
                fontSize: "13px",
              },
            });

            edgesArr.push({
              id: `e-${sectionId}-${childId}`,
              source: sectionId,
              target: childId,
            });
          });
      });

    return getLayoutedElements(nodesArr, edgesArr);
  }, [data]);

  /* ---------- Render ---------- */
  return (
    <div className="h-[650px] w-full border rounded-lg overflow-hidden bg-white">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.4}
        maxZoom={1.5}
      >
        <MiniMap />
        <Controls />
        <Background />
      </ReactFlow>
    </div>
  );
}
