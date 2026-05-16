import { Link } from "react-router-dom";
import styles from "../../CategoryPage.module.scss";

type ModuleItem = { id: string; title: string; summary: string };
const MODULES: ModuleItem[] = [
];

type Props = {
    categoryId?: string;
    initialData?: { title?: string;[k: string]: any } | null;
};

export default function DataStructuresPage({ categoryId, initialData }: Props) {
    const id = categoryId ?? "algorithms";
    const modules: ModuleItem[] = MODULES;

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>{initialData?.title ?? id.replace("-", " ")}</h1>
            <div className={styles.list}>
                {modules.length ? (
                    modules.map((m) => (
                        <Link key={m.id} to={`/category/${id}/module/${m.id}`} className={styles.moduleCard}>
                            <h3>{m.title}</h3>
                            <p>{m.summary}</p>
                        </Link>
                    ))
                ) : (
                    <p>No modules found for this category.</p>
                )}
            </div>
        </div>
    );
}
