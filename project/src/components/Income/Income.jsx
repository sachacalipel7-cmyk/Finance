import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import ConfirmDialog from '../Common/ConfirmDialog';
import { formatCurrency, sumMonthlyEquivalent } from '../../utils/financial';

const frequencies = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'annual', label: 'Annuel' },
  { value: 'one_time', label: 'Ponctuel' },
];

export default function Income() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [incomes, setIncomes] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [incomeToDelete, setIncomeToDelete] = useState(null);
  const [formData, setFormData] = useState({
    source: '',
    amount: '',
    frequency: 'monthly',
  });

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    const amount = Number.parseFloat(formData.amount);
    return (
      formData.source.trim().length > 0 &&
      !Number.isNaN(amount) &&
      amount >= 0
    );
  }, [formData.amount, formData.source, isSubmitting]);

  const fetchIncomes = useCallback(async () => {
    if (!user?.id) return;
    setIsFetching(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIncomes(data || []);
    } catch (error) {
      console.error('Error fetching incomes:', error);
      setError("Impossible de charger vos revenus.");
      notify({
        type: 'error',
        title: 'Chargement des revenus',
        message: "Une erreur est survenue lors de la récupération de vos revenus.",
      });
    } finally {
      setIsFetching(false);
    }
  }, [notify, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setIncomes([]);
      return;
    }
    fetchIncomes();
  }, [fetchIncomes, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id || !canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.from('income').insert([
        {
          user_id: user.id,
          source: formData.source,
          amount: Number.parseFloat(formData.amount),
          frequency: formData.frequency,
        },
      ]);

      if (error) throw error;

      setFormData({ source: '', amount: '', frequency: 'monthly' });
      setShowForm(false);
      await fetchIncomes();
      notify({
        type: 'success',
        title: 'Revenu ajouté',
        message: 'Le revenu a été enregistré.',
      });
    } catch (error) {
      console.error('Error creating income:', error);
      setError("Impossible d'enregistrer ce revenu. Veuillez réessayer.");
      notify({
        type: 'error',
        title: 'Ajout du revenu',
        message: "Une erreur est survenue lors de l'ajout du revenu.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!incomeToDelete) return;
    try {
      const { error } = await supabase.from('income').delete().eq('id', incomeToDelete.id);

      if (error) throw error;
      setIncomeToDelete(null);
      await fetchIncomes();
      notify({
        type: 'success',
        title: 'Revenu supprimé',
        message: 'Le revenu a été retiré.',
      });
    } catch (error) {
      console.error('Error deleting income:', error);
      notify({
        type: 'error',
        title: 'Suppression du revenu',
        message: "Impossible de supprimer ce revenu pour le moment.",
      });
    }
  };

  const monthlyTotal = sumMonthlyEquivalent(incomes);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mes revenus</h2>
          <p className="text-gray-600 mt-1">Suivez vos différentes sources de revenus</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-success-600 text-white rounded-lg hover:bg-success-700 transition"
        >
          {showForm ? 'Annuler' : '+ Ajouter un revenu'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-success-100 p-3 rounded-lg">
            <span className="text-2xl">💵</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Revenus mensuels totaux</p>
            <p className="text-3xl font-bold text-success-700">{formatCurrency(monthlyTotal)}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Nouveau revenu</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source de revenu
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-success-500 focus:border-transparent"
                placeholder="Ex: Salaire, Prime, Freelance..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-success-500 focus:border-transparent"
                placeholder="0.00"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fréquence
              </label>
              <select
                value={formData.frequency}
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-success-500 focus:border-transparent"
              >
                {frequencies.map((freq) => (
                  <option key={freq.value} value={freq.value}>
                    {freq.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-success-600 text-white py-2 rounded hover:bg-success-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Ajout...' : 'Ajouter le revenu'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Source</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Montant</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Fréquence</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {incomes.map((income) => (
              <tr key={income.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{income.source}</td>
                <td className="px-6 py-4 text-sm font-medium text-success-700">
                  {formatCurrency(income.amount)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {frequencies.find((f) => f.value === income.frequency)?.label}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setIncomeToDelete(income)}
                    className="text-red-600 hover:text-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isFetching && incomes.length === 0 && (
          <div className="text-center py-12 text-gray-500">Chargement des revenus…</div>
        )}

        {incomes.length === 0 && !showForm && !isFetching && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucun revenu ajouté pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Cliquez sur "Ajouter un revenu" pour commencer</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(incomeToDelete)}
        title="Supprimer ce revenu ?"
        description={`Le revenu "${incomeToDelete?.source ?? ''}" sera supprimé.`}
        confirmLabel="Supprimer"
        onCancel={() => setIncomeToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
