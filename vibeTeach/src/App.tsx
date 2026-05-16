import { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const Home = lazy(() => import("./pages/Home"));
const CategoryRouter = lazy(() => import("./pages/CategoryRouter"));
const ModuleRouter = lazy(() => import("./pages/ModuleRouter"));

export default function App() {
    return (
        <Layout>
            <Suspense fallback={<div>Loading…</div>}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/categories" element={<Home />} />
                    <Route path="/category/:categoryId" element={<CategoryRouter />} />
                    <Route path="/category/:categoryId/module/:moduleId" element={<ModuleRouter />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </Suspense>
        </Layout>
    );
}
