export default function ModulePage({ moduleId }: { moduleId?: string }) {
    return (
        <div>
            <h1>Binary Tree Module</h1>
            <p>Category: data-structures</p>
            <p>Module ID: {moduleId ?? "none"}</p>
        </div>
    );
}
