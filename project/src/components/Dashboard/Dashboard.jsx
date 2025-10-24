import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, sumMonthlyEquivalent } from '../../utils/financial';

const COLORS = ['#0073e6', '#00a551', '#4da6ff', '#1ab568', '#80c0ff', '#80d6ab'];

export default function Dashboard() {
  const { user } = useAuth();
  const { notify } = useNotifications();
  const [accounts, setAccounts] = useState([]);
  const [income, setIncome] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    setIsFetching(true);
    setError(null);
    try {
      const [accountsRes, incomeRes, expensesRes] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('income').select('*').eq('user_id', user.id),
        supabase.from('expenses').select('*').eq('user_id', user.id),
      ]);

      if (accountsRes.error || incomeRes.error || expensesRes.error) {
        throw accountsRes.error || incomeRes.error || expensesRes.error;
      }

      setAccounts(accountsRes.data || []);
      setIncome(incomeRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Impossible de charger vos données financières.');
      notify({
        type: 'error',
        title: 'Tableau de bord',
        message: "Une erreur est survenue lors du chargement de vos données.",
      });
    } finally {
      setIsFetching(false);
    }
  }, [notify, user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setAccounts([]);
      setIncome([]);
      setExpenses([]);
      return;
    }
    fetchData();
  }, [fetchData, user?.id]);

  const totalBalance = accounts.reduce((sum, acc) => sum + Number.parseFloat(acc.balance || 0), 0);
  const monthlyIncome = sumMonthlyEquivalent(income);
  const monthlyExpenses = sumMonthlyEquivalent(expenses);

  const accountsData = accounts.map((acc) => ({
    name: acc.account_name,
    value: Number.parseFloat(acc.balance || 0),
  }));

  const expensesData = expenses
    .reduce((acc, e) => {
      const existing = acc.find((item) => item.name === e.category);
      if (existing) {
        existing.value += sumMonthlyEquivalent([e]);
      } else {
        acc.push({ name: e.category, value: sumMonthlyEquivalent([e]) });
      }
      return acc;
    }, []);

  if (isFetching && accounts.length === 0 && income.length === 0 && expenses.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-600">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-600 mt-1">Vue d'ensemble de vos finances</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-100 p-3 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Patrimoine total</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalBalance)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-success-100 p-3 rounded-lg">
              <span className="text-2xl">💵</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Revenus mensuels</p>
              <p className="text-2xl font-bold text-success-700">{formatCurrency(monthlyIncome)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-red-100 p-3 rounded-lg">
              <span className="text-2xl">💳</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dépenses mensuelles</p>
              <p className="text-2xl font-bold text-red-700">{formatCurrency(monthlyExpenses)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Répartition des comptes</h3>
          {accountsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={accountsData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {accountsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Aucun compte ajouté
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Dépenses mensuelles par catégorie</h3>
          {expensesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensesData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Aucune dépense ajoutée
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Épargne mensuelle</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Capacité d'épargne</p>
            <p className={`text-3xl font-bold ${monthlyIncome - monthlyExpenses >= 0 ? 'text-success-700' : 'text-red-700'}`}>
              {formatCurrency(monthlyIncome - monthlyExpenses)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Taux d'épargne</p>
            <p className={`text-3xl font-bold ${monthlyIncome > 0 ? 'text-primary-700' : 'text-gray-700'}`}>
              {monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome * 100).toFixed(1) : '0'}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
