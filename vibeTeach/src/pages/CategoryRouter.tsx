import React, { Suspense, lazy } from "react";
import { useParams, Navigate } from "react-router-dom";

const DataStructures = lazy(() => import("./category/data-structures/index"));
const Algorithms = lazy(() => import("./category/algorithms/index"));

type CategoryKey = "data-structures" | "algorithms";

const categoryMap: Record<CategoryKey, React.LazyExoticComponent<React.ComponentType<any>>> = {
    "data-structures": DataStructures,
    "algorithms": Algorithms,
};

export default function CategoryRouter() {
    const { categoryId } = useParams<{ categoryId: string }>();

    if (!categoryId) {
        return <Navigate to="/category" replace />;
    }
    if (!Object.prototype.hasOwnProperty.call(categoryMap, categoryId)) {
        return <Navigate to="/category" replace />;
    }

    const CategoryComponent = categoryMap[categoryId as CategoryKey];

    const initialData = ((): any => {
        if (categoryId === "data-structures") return { title: "Data Structures", example: "Binary Tree" };
        if (categoryId === "algorithms") return { title: "Algorithms", example: "Dijkstra" };
        return null;
    })();

    return (
        <Suspense fallback={<div>Loading category…</div>}>
            <CategoryComponent categoryId={categoryId} initialData={initialData} />
        </Suspense>
    );
}
