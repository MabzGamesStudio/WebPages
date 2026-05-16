import { Link } from "react-router-dom";
import styles from "../../CategoryPage.module.scss";

type ModuleItem = { id: string; title: string; summary: string };
const MODULES: ModuleItem[] = [
    { id: "array", title: "Array", summary: "Array." },
    { id: "linked-list", title: "Linked List", summary: "Linked List." },
    { id: "binary-tree", title: "Binary Tree", summary: "Binary Tree." },
];

type Props = {
    categoryId?: string;
    initialData?: { title?: string;[k: string]: any } | null;
};

export default function DataStructuresPage({ categoryId, initialData }: Props) {
    const id = categoryId ?? "data-structures";
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
