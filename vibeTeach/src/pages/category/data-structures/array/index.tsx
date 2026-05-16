// ArraysModule.tsx
import React, { useState } from 'react';

// Import components
import WikipediaHeader from './Wikipedia';
import AnimationSection from './Animations';
import BigONotationSection from './BigONotation';
import ProsConsSection from './ProsCons';
import CodeSandboxSection, { defaultCode } from './CodeExample';
import UseCasesSection from './UseCases';
import RelatedStructuresSection from './Related';

const ArraysModule: React.FC = () => {

    return (
        <div className="arrays-module">
            <WikipediaHeader />
            <AnimationSection />
            <BigONotationSection />
            <ProsConsSection />
            <CodeSandboxSection />
            <UseCasesSection />
            <RelatedStructuresSection />
        </div>
    );
};

export default ArraysModule;