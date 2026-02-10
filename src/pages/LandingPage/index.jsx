import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TubesCursor from 'threejs-components/build/cursors/tubes1.min.js';
import './styles.css';

const LandingPage = () => {
    const canvasRef = useRef(null);
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    // Scroll Effect for Header
    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Anima Effect Initialization
    useEffect(() => {
        if (!canvasRef.current) return;

        // OPTIMIZATION: Limit Pixel Ratio to 1 AND limit canvas size
        // This is an aggressive optimization: Render at 50% resolution and upsell with CSS
        // This cuts pixel processing by 75%
        const originalDPR = window.devicePixelRatio;
        const RENDER_SCALE = 0.5; // Render at half resolution

        try {
            // Force reduced DPR
            Object.defineProperty(window, 'devicePixelRatio', {
                get: () => 1 // Keep at 1, we handle scaling manually via canvas size
            });
        } catch (e) {
            console.warn("Could not override DPR", e);
        }

        let app;
        try {
            // Manually set canvas size to control resolution
            const rect = canvasRef.current.parentElement.getBoundingClientRect();
            canvasRef.current.width = rect.width * RENDER_SCALE;
            canvasRef.current.height = rect.height * RENDER_SCALE;

            app = TubesCursor(canvasRef.current, {
                tubes: {
                    colors: ["#f967fb", "#53bc28", "#6958d5"],
                    lights: {
                        intensity: 200,
                        colors: ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"]
                    }
                }
            });

            // Interactive Colors on Click
            const handleClick = (e) => {
                if (e.target.closest('.hero-wrapper')) {
                    const colors = randomColors(3);
                    const lightsColors = randomColors(4);
                    if (app.tubes?.setColors) app.tubes.setColors(colors);
                    if (app.tubes?.setLightsColors) app.tubes.setLightsColors(lightsColors);
                }
            };

            document.addEventListener('click', handleClick);

            // OPTIMIZATION: Handle Resize with Debounce
            // We must manually update the canvas size on resize to maintain the 0.5 scale
            let resizeTimeout;
            const handleResize = () => {
                if (resizeTimeout) clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    if (!canvasRef.current || !canvasRef.current.parentElement) return;
                    const rect = canvasRef.current.parentElement.getBoundingClientRect();
                    canvasRef.current.width = rect.width * RENDER_SCALE;
                    canvasRef.current.height = rect.height * RENDER_SCALE;
                    // Some Three.js app wrappers need a manual resize trigger, 
                    // but changing canvas width/height usually forces it. 
                    // If the library exposes .resize(), call it here.
                }, 100);
            };
            window.addEventListener('resize', handleResize);

            // Restore DPR hack
            setTimeout(() => {
                try {
                    Object.defineProperty(window, 'devicePixelRatio', {
                        get: () => originalDPR
                    });
                } catch (e) { }
            }, 100);

            return () => {
                document.removeEventListener('click', handleClick);
                window.removeEventListener('resize', handleResize);
                // Attempt cleanup
                if (canvasRef.current) {
                    canvasRef.current.innerHTML = '';
                    // Force WebGL context loss if possible (library specific, but removing node helps)
                }
                app = null;
            };
        } catch (error) {
            console.error("Failed to initialize Anima effect:", error);
        }

    }, []);

    const randomColors = (count) => {
        return new Array(count)
            .fill(0)
            .map(() => "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'));
    };

    return (
        <div id="landing-app">

            {/* --- Navigation --- */}
            <header className={`landing-header ${scrolled ? 'scrolled' : ''}`}>
                <div className="landing-logo">QualyBuss</div>
                <nav className="landing-nav">
                    <a href="#features">Funcionalidades</a>
                    <a href="#partners">Parceiros</a>
                    <a href="#about">Sobre</a>
                    <Link to="/login" className="nav-cta">Acessar Sistema</Link>
                </nav>
            </header>

            {/* --- Hero Section (Restricted Anima) --- */}
            <div className="hero-wrapper">
                <canvas ref={canvasRef} id="canvas-container"></canvas>
                <div className="hero-content">
                    <h1>QualyBuss</h1>
                    <h2>Intelligence</h2>
                    <button className="hero-cta" onClick={() => navigate('/login')}>
                        Começar Agora
                    </button>
                </div>
            </div>

            {/* --- Features Section --- */}
            <section id="features" className="section">
                <div className="section-header">
                    <span className="section-label">Nossas Soluções</span>
                    <h2 className="section-title">Tecnologia completa para<br />gestão de pessoas</h2>
                </div>

                <div className="features-grid">
                    <FeatureCard
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="Gestão de Ponto"
                        desc="Controle avançado de jornada, horas extras e banco de horas com regras complexas (CLT/PJ)."
                    />
                    <FeatureCard
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                        title="Compliance e Auditoria"
                        desc="Monitoramento em tempo real de conformidade trabalhista com alertas inteligentes."
                    />
                    <FeatureCard
                        icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                        title="Portal do Colaborador"
                        desc="Transparência total para os funcionários consultarem holerites, espelhos de ponto e solicitações."
                    />
                </div>
            </section>

            {/* --- Partners Section --- */}
            <section id="partners" className="partners-section">
                <div className="section-header" style={{ marginBottom: '2rem' }}>
                    <span className="section-label" style={{ color: '#94a3b8' }}>Quem confia</span>
                    <h2 className="section-title" style={{ color: 'white' }}>Parceiros Estratégicos</h2>
                </div>
                <div className="partners-grid">
                    <span className="partner-logo">TECHCORP</span>
                    <span className="partner-logo">INOVAFIN</span>
                    <span className="partner-logo">GLOBALHR</span>
                    <span className="partner-logo">STARTGRO</span>
                </div>
            </section>

            {/* --- Footer --- */}
            <footer className="landing-footer">
                <div className="footer-content">
                    <div className="footer-col">
                        <h4>QualyBuss</h4>
                        <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Transformando a gestão de RH com inteligência e tecnologia.</p>
                    </div>
                    <div className="footer-col">
                        <h4>Produto</h4>
                        <ul>
                            <li><a href="#">Funcionalidades</a></li>
                            <li><a href="#">Planos</a></li>
                            <li><a href="#">Para Empresas</a></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Legal</h4>
                        <ul>
                            <li><Link to="/terms">Termos de Uso</Link></li>
                            <li><Link to="/privacy">Privacidade</Link></li>
                        </ul>
                    </div>
                    <div className="footer-col">
                        <h4>Contato</h4>
                        <ul>
                            <li><a href="#">Suporte</a></li>
                            <li><a href="#">Vendas</a></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    &copy; {new Date().getFullYear()} QualyBuss. Todos os direitos reservados.
                </div>
            </footer>
        </div>
    );
};

const FeatureCard = ({ icon, title, desc }) => (
    <div className="feature-card">
        <div className="feature-icon">{icon}</div>
        <h3>{title}</h3>
        <p>{desc}</p>
    </div>
);

export default LandingPage;
