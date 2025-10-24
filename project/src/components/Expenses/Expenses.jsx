import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import ConfirmDialog from '../Common/ConfirmDialog';
import { formatCurrency, sumMonthlyEquivalent } from '../../utils/financial';

const categories = [
  'Loyer',
  'Alimentation',
  'Transport',
  'Assurances',
  'Abonnements',
  'Loisirs',
  'Santé',
  'Éducation',
  'Autre',
];

const frequencies = [
  { value: 'monthly', label: 'Mensuel' },
  { value: 'quarterly', label: 'Trimestriel' },
  { value: 'annual', label: 'Annuel' },
  { value: 'one_time', label: 'Ponctuel' },
];

export default function Expenses() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [expenses, setExpenses] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState(null);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [formData, setFormData] = useState({
    category: 'Loyer',
    description: '',
    amount: '',
    frequency: 'monthly',
  });

  const canSubmit = useMemo(() => {
    if (isSubmitting) return false;
    const amount = Number.parseFloat(formData.amount);
    return (
      !Number.isNaN(amount) &&
      amount >= 0 &&
      formData.category.trim().length > 0
    );
  }, [formData.amount, formData.category, isSubmitting]);

  const fetchExpenses = useCallback(async () => {
    if (!user?.id) return;
    setIsFetching(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Impossible de charger vos dépenses.');
      notify({
        type: 'error',
        title: 'Chargement des dépenses',
        message: 'Une erreur est survenue lors de la récupération de vos dépenses.',
      });
    } finally {
      setIsFetching(false);
    }
  }, [notify, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setExpenses([]);
      return;
    }
    fetchExpenses();
  }, [fetchExpenses, user?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id || !canSubmit) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await supabase.from('expenses').insert([
        {
          user_id: user.id,
          category: formData.category,
          description: formData.description,
          amount: Number.parseFloat(formData.amount),
          frequency: formData.frequency,
        },
      ]);

      if (error) throw error;

      setFormData({ category: 'Loyer', description: '', amount: '', frequency: 'monthly' });
      setShowForm(false);
      await fetchExpenses();
      notify({
        type: 'success',
        title: 'Dépense ajoutée',
        message: 'La dépense a été enregistrée.',
      });
    } catch (error) {
      console.error('Error creating expense:', error);
      setError("Impossible d'enregistrer cette dépense. Veuillez réessayer.");
      notify({
        type: 'error',
        title: 'Ajout de dépense',
        message: "Une erreur est survenue lors de l'ajout de la dépense.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!expenseToDelete) return;
    try {
      const { error } = await supabase.from('expenses').delete().eq('id', expenseToDelete.id);

      if (error) throw error;
      setExpenseToDelete(null);
      await fetchExpenses();
      notify({
        type: 'success',
        title: 'Dépense supprimée',
        message: 'La dépense a été retirée.',
      });
    } catch (error) {
      console.error('Error deleting expense:', error);
      notify({
        type: 'error',
        title: 'Suppression de dépense',
        message: "Impossible de supprimer cette dépense pour le moment.",
      });
    }
  };

  const monthlyTotal = sumMonthlyEquivalent(expenses);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Mes dépenses</h2>
          <p className="text-gray-600 mt-1">Gérez vos dépenses récurrentes et ponctuelles</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          {showForm ? 'Annuler' : '+ Ajouter une dépense'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-red-100 p-3 rounded-lg">
            <span className="text-2xl">💳</span>
          </div>
          <div>
            <p className="text-sm text-gray-600">Dépenses mensuelles totales</p>
            <p className="text-3xl font-bold text-red-700">{formatCurrency(monthlyTotal)}</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Nouvelle dépense</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Ex: Loyer appartement Paris"
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
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"
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
              className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Ajout...' : 'Ajouter la dépense'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Catégorie</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Description</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Montant</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Fréquence</th>
              <th className="px-6 py-3 text-right text-sm font-medium text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {expenses.map((expense) => (
              <tr key={expense.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{expense.category}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{expense.description || '-'}</td>
                <td className="px-6 py-4 text-sm font-medium text-red-700">
                  {formatCurrency(expense.amount)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {frequencies.find((f) => f.value === expense.frequency)?.label}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => setExpenseToDelete(expense)}
                    className="text-red-600 hover:text-red-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {isFetching && expenses.length === 0 && (
          <div className="text-center py-12 text-gray-500">Chargement des dépenses…</div>
        )}

        {expenses.length === 0 && !showForm && !isFetching && (
          <div className="text-center py-12">
            <p className="text-gray-500">Aucune dépense ajoutée pour le moment</p>
            <p className="text-gray-400 text-sm mt-1">Cliquez sur "Ajouter une dépense" pour commencer</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={Boolean(expenseToDelete)}
        title="Supprimer cette dépense ?"
        description={`La dépense "${expenseToDelete?.description || expenseToDelete?.category || ''}" sera supprimée.`}
        confirmLabel="Supprimer"
        onCancel={() => setExpenseToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
