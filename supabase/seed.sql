-- ============================================
-- TypeRacer Clone — Seed Data
-- ============================================

-- =====================
-- WORDS mode (20 entries)
-- =====================
INSERT INTO sentences (text, mode, difficulty) VALUES
('apple banana cherry dog elephant frog guitar house igloo jacket', 'words', 'easy'),
('kite lemon monkey notebook orange pencil queen rabbit snake tiger', 'words', 'easy'),
('umbrella violin window xylophone yellow zebra anchor bridge castle dragon', 'words', 'easy'),
('forest garden hammer island jungle kitchen ladder mountain napkin ocean', 'words', 'easy'),
('palace question river sunset tunnel uniform village whistle crystal diamond', 'words', 'easy'),
('abstract brilliant cascade delicate enormous fragment graceful harmony intricate jubilant', 'words', 'medium'),
('knowledge luminous magnificent nocturnalObServant perpetual quintessent resilient spectrum tremendous', 'words', 'medium'),
('algorithm benchmark complexity deviation efficiency framework governance hierarchy iteration junction', 'words', 'medium'),
('kaleidoscope landscape metamorphosis navigation optimization parameter qualification redundancy simulation threshold', 'words', 'medium'),
('acceleration bibliography constellation deterioration electromagnetic fluorescence gravitational hypothetical infrastructure juxtaposition', 'words', 'medium'),
('ambiguous benevolent circumstantial demographic entrepreneurial fundamental geographical humanitarian ideological jurisdictional', 'words', 'medium'),
('contemporary diversification environmental functionality generalization hospitalization implementation justification legitimization manifestation', 'words', 'hard'),
('nationalization organizational pharmaceutical quintessential rationalization standardization transformation underestimation visualization weatherization', 'words', 'hard'),
('characterization differentiation experimentation fundamentalism globalization implementation jurisdictional knowledgeable liberalization modernization', 'words', 'hard'),
('cloud server network protocol database function module export import variable', 'words', 'easy'),
('promise callback async await fetch response request header status error', 'words', 'medium'),
('typescript interface component function render state effect context provider reducer', 'words', 'medium'),
('deploy container orchestration pipeline integration delivery monitoring logging tracing metrics', 'words', 'hard'),
('quantum neural synthetic parallel recursive modular abstract polymorphic concurrent distributed', 'words', 'hard'),
('venture capital portfolio acquisition merger stakeholder dividend equity treasury valuation', 'words', 'medium');

-- =====================
-- SENTENCES mode (20 entries)
-- =====================
INSERT INTO sentences (text, mode, difficulty) VALUES
('The quick brown fox jumps over the lazy dog near the riverbank.', 'sentences', 'easy'),
('She sells seashells by the seashore every summer morning.', 'sentences', 'easy'),
('A journey of a thousand miles begins with a single step forward.', 'sentences', 'easy'),
('The early bird catches the worm but the second mouse gets the cheese.', 'sentences', 'easy'),
('Every great developer was once a beginner who never gave up on learning.', 'sentences', 'easy'),
('Programming is not about typing fast, it is about thinking clearly and solving problems efficiently.', 'sentences', 'medium'),
('The best way to predict the future is to create it with your own hands and determination.', 'sentences', 'medium'),
('In the middle of difficulty lies opportunity, and those who seek it shall find great rewards.', 'sentences', 'medium'),
('Good code is its own best documentation, and well-named functions rarely need additional comments.', 'sentences', 'medium'),
('The only way to do great work is to love what you do and never stop improving your craft.', 'sentences', 'medium'),
('Success is not final and failure is not fatal. It is the courage to continue that counts the most.', 'sentences', 'medium'),
('Technology is best when it brings people together and helps them achieve things they could not do alone.', 'sentences', 'medium'),
('The internet is becoming the town square for the global village of tomorrow, connecting minds across continents.', 'sentences', 'medium'),
('Any sufficiently advanced technology is indistinguishable from magic, and we are living in magical times.', 'sentences', 'medium'),
('Software engineering is the art of balancing complexity with simplicity while delivering value to users consistently.', 'sentences', 'hard'),
('Debugging is twice as hard as writing the code in the first place, so write your code as simply as possible.', 'sentences', 'hard'),
('The measure of intelligence is the ability to change, adapt, and grow in the face of new challenges and opportunities.', 'sentences', 'hard'),
('Innovation distinguishes between a leader and a follower. Stay hungry, stay foolish, and never stop questioning everything.', 'sentences', 'hard'),
('Real-time systems require careful synchronization between distributed clients to maintain consistency without sacrificing performance.', 'sentences', 'hard'),
('Modern web applications leverage server-side rendering and client-side hydration to deliver optimal user experiences across devices.', 'sentences', 'hard');

-- =====================
-- TEXT mode (10 entries)
-- =====================
INSERT INTO sentences (text, mode, difficulty) VALUES
('The art of programming is the art of organizing complexity. Software development is fundamentally about managing the inherent complexity of the systems we build. Every line of code we write adds to this complexity, and every abstraction we create is an attempt to manage it. The best programmers are those who can create simple solutions to complex problems, breaking down large systems into manageable, understandable pieces that work together harmoniously.', 'text', 'medium'),
('In the world of web development, the landscape is constantly evolving. New frameworks emerge, best practices shift, and the tools we use today may be obsolete tomorrow. What remains constant is the need for clean, maintainable code that solves real problems for real users. The fundamentals of good software engineering transcend any particular technology stack, and developers who master these fundamentals can adapt to any new paradigm that comes along.', 'text', 'medium'),
('TypeScript has revolutionized the way we write JavaScript applications. By adding static type checking to the language, it catches entire categories of bugs at compile time rather than runtime. The type system serves as living documentation, making code more readable and maintainable. Teams that adopt TypeScript often report significant improvements in developer productivity and code quality, especially in large codebases where the benefits of type safety compound over time.', 'text', 'medium'),
('The rise of real-time web applications has transformed how users interact with software. Gone are the days when users had to refresh their browsers to see updated content. Modern applications use WebSockets, Server-Sent Events, and other technologies to push updates to clients instantly. This shift has created new challenges around state synchronization, conflict resolution, and bandwidth optimization that developers must carefully address to deliver seamless user experiences.', 'text', 'medium'),
('Database design is one of the most critical aspects of application development. A well-designed schema can make queries fast and intuitive, while a poorly designed one can lead to performance bottlenecks and maintenance nightmares. Normalization helps eliminate redundancy, but sometimes strategic denormalization is necessary for performance. Understanding the tradeoffs between different approaches is essential for building systems that scale gracefully as data volumes grow over time.', 'text', 'hard'),
('The concept of component-based architecture has become the dominant paradigm in modern frontend development. By breaking user interfaces into small, reusable, and composable pieces, developers can build complex applications with greater efficiency and consistency. Each component encapsulates its own logic, styling, and state, making it easier to reason about individual parts of the application. This approach also facilitates team collaboration, as different developers can work on different components simultaneously without stepping on each other.', 'text', 'hard'),
('Authentication and authorization are fundamental concerns in any web application. Authentication verifies who a user is, while authorization determines what they are allowed to do. Modern authentication systems often leverage tokens, sessions, and third-party identity providers to balance security with user convenience. Anonymous authentication has emerged as a powerful pattern that lets users start interacting with an application immediately while preserving the option to upgrade to a full account later without losing their data or history.', 'text', 'hard'),
('Performance optimization in web applications is a multifaceted challenge that spans the entire stack. On the frontend, techniques like code splitting, lazy loading, and efficient rendering minimize the amount of work the browser needs to do. On the backend, caching strategies, database indexing, and connection pooling help handle increasing loads. Network optimization through compression, CDNs, and protocol choices further reduces latency. The key is to measure first, identify real bottlenecks, and then apply targeted optimizations rather than prematurely optimizing based on assumptions.', 'text', 'hard'),
('State management in modern web applications has evolved significantly over the years. From simple global variables to complex Redux stores, developers have experimented with many approaches to keeping application state consistent and predictable. Libraries like Zustand offer a simpler alternative that embraces React hooks while still providing the benefits of centralized state management. The key insight is that not all state needs to be managed the same way. Server state, UI state, and URL state each have different characteristics and are best handled by specialized tools.', 'text', 'medium'),
('Testing is an essential practice that gives developers confidence to make changes without breaking existing functionality. Unit tests verify individual functions and components in isolation, integration tests check how pieces work together, and end-to-end tests validate complete user workflows. A well-balanced testing strategy combines all three levels, with more unit tests at the base, fewer integration tests in the middle, and a small number of end-to-end tests at the top. This testing pyramid approach provides comprehensive coverage while keeping the test suite fast and maintainable.', 'text', 'medium');

-- =====================
-- MIXED mode (duplicates from all modes above)
-- =====================
-- Words for mixed
INSERT INTO sentences (text, mode, difficulty) VALUES
('apple banana cherry dog elephant frog guitar house igloo jacket', 'mixed', 'easy'),
('kite lemon monkey notebook orange pencil queen rabbit snake tiger', 'mixed', 'easy'),
('abstract brilliant cascade delicate enormous fragment graceful harmony intricate jubilant', 'mixed', 'medium'),
('algorithm benchmark complexity deviation efficiency framework governance hierarchy iteration junction', 'mixed', 'medium'),
('acceleration bibliography constellation deterioration electromagnetic fluorescence gravitational hypothetical infrastructure juxtaposition', 'mixed', 'medium'),
('cloud server network protocol database function module export import variable', 'mixed', 'easy'),
('promise callback async await fetch response request header status error', 'mixed', 'medium'),
('typescript interface component function render state effect context provider reducer', 'mixed', 'medium'),
('deploy container orchestration pipeline integration delivery monitoring logging tracing metrics', 'mixed', 'hard'),
('quantum neural synthetic parallel recursive modular abstract polymorphic concurrent distributed', 'mixed', 'hard');

-- Sentences for mixed
INSERT INTO sentences (text, mode, difficulty) VALUES
('The quick brown fox jumps over the lazy dog near the riverbank.', 'mixed', 'easy'),
('Programming is not about typing fast, it is about thinking clearly and solving problems efficiently.', 'mixed', 'medium'),
('The best way to predict the future is to create it with your own hands and determination.', 'mixed', 'medium'),
('Good code is its own best documentation, and well-named functions rarely need additional comments.', 'mixed', 'medium'),
('Success is not final and failure is not fatal. It is the courage to continue that counts the most.', 'mixed', 'medium'),
('Software engineering is the art of balancing complexity with simplicity while delivering value to users consistently.', 'mixed', 'hard'),
('Debugging is twice as hard as writing the code in the first place, so write your code as simply as possible.', 'mixed', 'hard'),
('Real-time systems require careful synchronization between distributed clients to maintain consistency without sacrificing performance.', 'mixed', 'hard'),
('Modern web applications leverage server-side rendering and client-side hydration to deliver optimal user experiences across devices.', 'mixed', 'hard'),
('Every great developer was once a beginner who never gave up on learning.', 'mixed', 'easy');

-- Text for mixed
INSERT INTO sentences (text, mode, difficulty) VALUES
('The art of programming is the art of organizing complexity. Software development is fundamentally about managing the inherent complexity of the systems we build. Every line of code we write adds to this complexity, and every abstraction we create is an attempt to manage it. The best programmers are those who can create simple solutions to complex problems, breaking down large systems into manageable, understandable pieces that work together harmoniously.', 'mixed', 'medium'),
('TypeScript has revolutionized the way we write JavaScript applications. By adding static type checking to the language, it catches entire categories of bugs at compile time rather than runtime. The type system serves as living documentation, making code more readable and maintainable. Teams that adopt TypeScript often report significant improvements in developer productivity and code quality, especially in large codebases where the benefits of type safety compound over time.', 'mixed', 'medium'),
('Authentication and authorization are fundamental concerns in any web application. Authentication verifies who a user is, while authorization determines what they are allowed to do. Modern authentication systems often leverage tokens, sessions, and third-party identity providers to balance security with user convenience. Anonymous authentication has emerged as a powerful pattern that lets users start interacting with an application immediately while preserving the option to upgrade to a full account later without losing their data or history.', 'mixed', 'hard'),
('State management in modern web applications has evolved significantly over the years. From simple global variables to complex Redux stores, developers have experimented with many approaches to keeping application state consistent and predictable. Libraries like Zustand offer a simpler alternative that embraces React hooks while still providing the benefits of centralized state management. The key insight is that not all state needs to be managed the same way. Server state, UI state, and URL state each have different characteristics and are best handled by specialized tools.', 'mixed', 'medium'),
('Testing is an essential practice that gives developers confidence to make changes without breaking existing functionality. Unit tests verify individual functions and components in isolation, integration tests check how pieces work together, and end-to-end tests validate complete user workflows. A well-balanced testing strategy combines all three levels, with more unit tests at the base, fewer integration tests in the middle, and a small number of end-to-end tests at the top. This testing pyramid approach provides comprehensive coverage while keeping the test suite fast and maintainable.', 'mixed', 'medium');
