import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const questions = [
  {
    id: 'risk_tolerance',
    question: 'Quelle est votre tolérance au risque ?',
    options: [
      { value: 'conservative', label: 'Prudent', description: 'Je préfère la sécurité, même si les gains sont limités' },
      { value: 'moderate', label: 'Modéré', description: "J'accepte un risque modéré pour de meilleurs rendements" },
      { value: 'aggressive', label: 'Dynamique', description: 'Je suis prêt à prendre des risques pour maximiser mes gains' },
    ],
  },
  {
    id: 'investment_horizon',
    question: "Quel est votre horizon d'investissement ?",
    options: [
      { value: 'short', label: 'Court terme', description: 'Moins de 3 ans' },
      { value: 'medium', label: 'Moyen terme', description: '3 à 8 ans' },
      { value: 'long', label: 'Long terme', description: 'Plus de 8 ans' },
    ],
  },
];

export default function Profile() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [profile, setProfile] = useState(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    age: '',
    monthly_income: '',
    risk_tolerance: '',
    investment_horizon: '',
    life_goals: '',
  });

  const populateForm = useCallback((data) => {
    setFormData({
      full_name: data?.full_name || '',
      age: data?.age || '',
      monthly_income: data?.monthly_income || '',
      risk_tolerance: data?.risk_tolerance || '',
      investment_horizon: data?.investment_horizon || '',
      life_goals: data?.life_goals || '',
    });
  }, []);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    setIsFetching(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setProfile(data);
        populateForm(data);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Impossible de charger votre profil pour le moment.');
      notify({
        type: 'error',
        title: 'Profil',
        message: "Une erreur est survenue lors du chargement du profil.",
      });
    } finally {
      setIsFetching(false);
    }
  }, [notify, populateForm, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setEditing(false);
      populateForm(null);
      setIsFetching(false);
      return;
    }
    fetchProfile();
  }, [fetchProfile, populateForm, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          age: formData.age ? Number.parseInt(formData.age, 10) : null,
          monthly_income: formData.monthly_income ? Number.parseFloat(formData.monthly_income) : 0,
          risk_tolerance: formData.risk_tolerance,
          investment_horizon: formData.investment_horizon,
          life_goals: formData.life_goals,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setEditing(false);
      await fetchProfile();
      notify({
        type: 'success',
        title: 'Profil mis à jour',
        message: 'Vos informations personnelles ont été enregistrées.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      setError("Impossible de mettre à jour votre profil pour le moment.");
      notify({
        type: 'error',
        title: 'Profil',
        message: "Une erreur est survenue lors de la sauvegarde du profil.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    populateForm(profile);
  };

  const isProfileComplete = useMemo(() => (
    Boolean(profile?.risk_tolerance) && Boolean(profile?.investment_horizon)
  ), [profile]);

  if (isFetching && !profile) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mon profil</h2>
          <p className="text-gray-600 mt-1">Complétez votre profil pour des recommandations personnalisées</p>
        </div>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Modifier le profil
          </button>
        )}
      </div>

      {!isProfileComplete && !editing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-yellow-900">Profil incomplet</h3>
              <p className="text-yellow-800 text-sm mt-1">
                Complétez votre profil pour recevoir des recommandations d'investissement personnalisées.
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {editing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Âge
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  min="18"
                  max="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Revenu mensuel net (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.monthly_income}
                  onChange={(e) => setFormData({ ...formData, monthly_income: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="space-y-6 border-t pt-6">
              {questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-gray-900 mb-3">
                    {q.question}
                  </label>
                  <div className="space-y-2">
                    {q.options.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-start p-4 border rounded-lg cursor-pointer transition ${
                          formData[q.id] === option.value
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-primary-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          value={option.value}
                          checked={formData[q.id] === option.value}
                          onChange={(e) => setFormData({ ...formData, [q.id]: e.target.value })}
                          className="mt-1 mr-3"
                          required
                        />
                        <div>
                          <p className="font-medium text-gray-900">{option.label}</p>
                          <p className="text-sm text-gray-600">{option.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Objectifs de vie
              </label>
              <textarea
                value={formData.life_goals}
                onChange={(e) => setFormData({ ...formData, life_goals: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                rows={4}
                placeholder="Décrivez vos objectifs financiers et de vie"
              />
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </form>
        ) : profile ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600">Nom complet</p>
                <p className="text-lg font-semibold text-gray-900">{profile.full_name || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Âge</p>
                <p className="text-lg font-semibold text-gray-900">{profile.age || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Revenu mensuel net</p>
                <p className="text-lg font-semibold text-gray-900">{profile.monthly_income ? `${profile.monthly_income} €` : '-'}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Tolérance au risque</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{profile.risk_tolerance || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Horizon d'investissement</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{profile.investment_horizon || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Objectifs de vie</p>
                <p className="text-gray-900 whitespace-pre-line">{profile.life_goals || 'Non renseigné'}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500">Aucune information de profil enregistrée pour le moment.</div>
        )}
      </div>
    </div>
  );
}
