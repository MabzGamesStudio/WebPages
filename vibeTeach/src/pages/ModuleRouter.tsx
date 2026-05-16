import React, { Suspense, lazy } from "react";
import { useParams, Navigate } from "react-router-dom";

/* map categoryId -> component (lazy optional) */
const Components: Record<string, React.LazyExoticComponent<React.ComponentType<any>>> = {
    "data-structures-array": lazy(() => import("./category/data-structures/array")),
    "data-structures-linked-list": lazy(() => import("./category/data-structures/linked-list")),
    "data-structures-binary-tree": lazy(() => import("./category/data-structures/binary-tree")),
};

export default function ModuleRouter() {
    const { categoryId, moduleId } = useParams<{ categoryId: string; moduleId: string }>();
    if (!categoryId) {
        return <Navigate to="/category" replace />;
    }

    const Comp = Components[`${categoryId}-${moduleId}`];
    if (!Comp) {
        // unknown category → render NotFound or redirect to categories
        return <Navigate to={`/category/${categoryId}`} replace />;
    }

    return (
        <Suspense fallback={<div>Loading module…</div>}>
            <Comp moduleId={moduleId} />
        </Suspense>
    );
}
