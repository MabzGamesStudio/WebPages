import React from "react";
import styles from "./Related.module.scss";

const relatedStructures = [
    { link: "dynamic-array", name: "Dynamic Array (ArrayList)" },
    { link: "linked-list", name: "Linked List" },
    { link: "stack", name: "Stack" },
    { link: "queue", name: "Queue" },
    { link: "string", name: "String (array of chars)" },
    { link: "matrix", name: "Matrix" },
];

const RelatedStructuresSection: React.FC = () => {
    return (
        <section className={`${styles.card} ${styles.relatedCard}`}>
            <h2 className={styles.heading}>Related Data Structures</h2>
            <div className={styles.relatedList}>
                {relatedStructures.map((structure, idx) => (
                    <a
                        key={idx}
                        className={styles.relatedBadge}
                        href={`/#/category/data-structures/module/${structure.link}`}
                    >
                        {structure.name}
                    </a>
                ))}
            </div>
        </section>
    );
};

export default RelatedStructuresSection;
