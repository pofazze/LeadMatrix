import styles from './Painel.module.scss';
import Navbar from '../components/Navbar';

export default function Painel() {
  return (
    <>
      <Navbar />
      <div className={styles.bg}>
        <div className={styles.container}>
          <h1 className={styles.title}>Bem-vindo ao LeadMatrix!</h1>
          <p className={styles.subtitle}>Você está logado no painel de gestão.</p>
          <div className={styles.copyright}>
            © {new Date().getFullYear()} LeadMatrix
          </div>
        </div>
      </div>
    </>
  );
}
