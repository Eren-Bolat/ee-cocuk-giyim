import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { useStore } from '../context/StoreContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { user, authLoading } = useStore();

  useEffect(() => {
    if (!authLoading && user) {
      navigate('/profile');
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          name,
          surname,
          address: '',
          email
        });
      }
      navigate('/profile');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Hata: Sistem geçici olarak kullanılamıyor.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('Hata: Bu e-posta adresi zaten kullanımda.');
      } else if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setError('Hata: E-posta adresi veya şifre hatalı.');
      } else if (err.code === 'auth/weak-password') {
        setError('Hata: Şifre çok zayıf. En az 6 karakter olmalıdır.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Hata: Geçersiz bir e-posta adresi girdiniz.');
      } else {
        setError('Hata: Bir sorun oluştu. Lütfen tekrar deneyin.');
      }
    }
  };

  return (
    <div className="flex justify-center items-center py-20">
      <div className="card p-10 rounded-3xl shadow-sm border border-border-color w-full max-w-md relative z-10">
        <h1 className="text-3xl font-black text-primary-pink mb-8 text-center uppercase tracking-wider">
          {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
        </h1>

        {error && (
          <div
            className="p-3 rounded-xl text-sm font-bold mb-6 text-center"
            style={{
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              border: '1px solid rgba(239, 68, 68, 0.3)'
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {!isLogin && (
            <>
              <div>
                <label className="label">Ad</label>
                <input
                  type="text"
                  className="input-field"
                  required={!isLogin}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Soyad</label>
                <input
                  type="text"
                  className="input-field"
                  required={!isLogin}
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                />
              </div>
            </>
          )}

          <div>
            <label className="label">E-Posta Adresi</label>
            <input
              type="email"
              className="input-field"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Şifre</label>
            <input
              type="password"
              className="input-field"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-full py-3 mt-2">
            {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm font-bold text-muted">
          {isLogin ? 'Hesabınız yok mu? ' : 'Zaten hesabınız var mı? '}
          <button
            type="button"
            className="text-primary-blue hover:underline"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Hemen Kayıt Olun' : 'Giriş Yapın'}
          </button>
        </div>
      </div>
    </div>
  );
}
