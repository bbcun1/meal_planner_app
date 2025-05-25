import React, { useState, useEffect, useRef } from 'react';
import { RefreshCw, ChefHat, Book, FileText, ShoppingCart, ChevronLeft } from 'lucide-react';

interface RawDataEntry {
  id: number;
  mealName: string;
  category: string;
  specialist: string;
  mainIngredient: string;
  book: string;
  page: string | number;
  serves: string | number;
  ingredients: string;
  quantity: number | string;
  measurement: string;
}

interface Meal {
  id: string;
  mealName: string;
  category: string;
  specialist: string;
  mainIngredient: string;
  book: string;
  page: string;
  serves: string;
  ingredientsList: string;
}

interface ParsedIngredient {
  quantity: number;
  unit: string;
  name: string;
  raw: string;
}

interface AggregatedIngredient {
  name: string;
  quantity: number;
  unit: string;
  items: ParsedIngredient[];
}

const getMockMeals = (): Meal[] => [
  {
    id: '1',
    mealName: 'Spaghetti Bolognese',
    category: 'Pasta',
    specialist: 'Italian',
    mainIngredient: 'Beef',
    book: 'The Italian Cookbook',
    page: '45',
    serves: '4',
    ingredientsList: '400g minced beef\n2 tbsp olive oil\n1 onion, chopped\n2 garlic cloves, crushed\n400g canned tomatoes\n300g spaghetti'
  },
  {
    id: '2',
    mealName: 'Chicken Curry',
    category: 'Asian',
    specialist: 'Indian',
    mainIngredient: 'Chicken',
    book: 'Indian Cooking',
    page: '78',
    serves: '4',
    ingredientsList: '500g chicken\n2 tbsp curry powder\n1 onion\n2 garlic cloves\n400ml coconut milk'
  }
];

export default function MealPlannerApp() {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedMeals, setSelectedMeals] = useState<Meal[]>([]);
  const [acceptedMeals, setAcceptedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAccepted, setShowAccepted] = useState(false);
  const [gifTriggered, setGifTriggered] = useState(false);
  const [usingDemoData, setUsingDemoData] = useState(false);
  const gifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMeals();
  }, []);

  const fetchMeals = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try direct API first
      const response = await fetch('https://api.sheety.co/292535b77f38b183d2f3d0036f450436/mealPlanV2/dataEntry');
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      if (!data?.dataEntry) throw new Error('Invalid data structure');
      
      setMeals(processMealData(data.dataEntry));
    } catch (err) {
      console.error('API Error:', err);
      setError('Failed to connect to API. Using demo data.');
      setMeals(getMockMeals());
      setUsingDemoData(true);
    } finally {
      setLoading(false);
    }
  };

  const processMealData = (rawData: RawDataEntry[]): Meal[] => {
    const mealsMap = new Map<string, Meal>();
    const ingredientsMap = new Map<string, string[]>();

    rawData.forEach((row) => {
      if (row.mealName?.trim()) {
        const meal: Meal = {
          id: row.id.toString(),
          mealName: row.mealName,
          category: row.category || '',
          specialist: row.specialist || '',
          mainIngredient: row.mainIngredient || '',
          book: row.book || '',
          page: row.page?.toString() || '',
          serves: row.serves?.toString() || '',
          ingredientsList: ''
        };
        mealsMap.set(meal.id, meal);
        
        if (row.ingredients?.trim()) {
          const ingredientString = `${row.quantity || ''} ${row.measurement || ''} ${row.ingredients}`.trim();
          ingredientsMap.set(meal.id, [ingredientString]);
        } else {
          ingredientsMap.set(meal.id, []);
        }
      } else if (row.ingredients?.trim()) {
        const mealIds = Array.from(mealsMap.keys());
        if (mealIds.length > 0) {
          const lastMealId = mealIds[mealIds.length - 1];
          const ingredients = ingredientsMap.get(lastMealId) || [];
          const ingredientString = `${row.quantity || ''} ${row.measurement || ''} ${row.ingredients}`.trim();
          ingredients.push(ingredientString);
          ingredientsMap.set(lastMealId, ingredients);
        }
      }
    });

    const processedMeals: Meal[] = [];
    mealsMap.forEach((meal, mealId) => {
      const ingredients = ingredientsMap.get(mealId) || [];
      meal.ingredientsList = ingredients.join('\n');
      processedMeals.push(meal);
    });

    return processedMeals;
  };

  const getPreviouslyAcceptedMealIds = (): string[] => {
    const stored = localStorage.getItem('lastAcceptedMeals');
    return stored ? JSON.parse(stored) : [];
  };

  const saveAcceptedMeals = (meals: Meal[]) => {
    localStorage.setItem('lastAcceptedMeals', JSON.stringify(meals.map(m => m.id)));
  };

  const getRandomMeals = (allMeals: Meal[], count: number = 5): Meal[] => {
    const previouslyAccepted = getPreviouslyAcceptedMealIds();
    let availableMeals = allMeals.filter(meal => !previouslyAccepted.includes(meal.id));
    if (availableMeals.length < count) availableMeals = allMeals;
    return [...availableMeals].sort(() => Math.random() - 0.5).slice(0, count);
  };

  const generateMealPlan = () => {
    if (meals.length === 0) return;
    setSelectedMeals(getRandomMeals(meals));
    setShowAccepted(false);
    setGifTriggered(true);
  };

  const refreshSingleMeal = (mealId: string) => {
    const currentMealIds = selectedMeals.map(m => m.id);
    const availableMeals = meals.filter(meal => !currentMealIds.includes(meal.id));
    if (availableMeals.length === 0) return;
    const randomMeal = availableMeals[Math.floor(Math.random() * availableMeals.length)];
    setSelectedMeals(prev => prev.map(meal => meal.id === mealId ? randomMeal : meal));
  };

  const acceptMeals = () => {
    setAcceptedMeals(selectedMeals);
    saveAcceptedMeals(selectedMeals);
    setShowAccepted(true);
  };

  const parseIngredient = (ingredient: string): ParsedIngredient => {
    const trimmed = ingredient.trim();
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/);
    if (match) {
      return {
        quantity: parseFloat(match[1]),
        unit: match[2] || '',
        name: match[3].toLowerCase().trim(),
        raw: trimmed
      };
    }
    const simpleMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    if (simpleMatch) {
      return {
        quantity: parseFloat(simpleMatch[1]),
        unit: '',
        name: simpleMatch[2].toLowerCase().trim(),
        raw: trimmed
      };
    }
    return {
      quantity: 0,
      unit: '',
      name: trimmed.toLowerCase(),
      raw: trimmed
    };
  };

  const aggregateIngredients = (meals: Meal[]): AggregatedIngredient[] => {
    const ingredientMap = new Map<string, AggregatedIngredient>();
    
    meals.forEach(meal => {
      meal.ingredientsList.split('\n').filter(line => line.trim()).forEach(ing => {
        const parsed = parseIngredient(ing);
        const key = `${parsed.name}-${parsed.unit}`;
        
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          existing.quantity += parsed.quantity;
          existing.items.push(parsed);
        } else {
          ingredientMap.set(key, {
            name: parsed.name,
            quantity: parsed.quantity,
            unit: parsed.unit,
            items: [parsed]
          });
        }
      });
    });
    
    return Array.from(ingredientMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading meals...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <h3 className="text-red-800 font-medium">Notice:</h3>
          <p className="text-red-700">{error}</p>
          {usingDemoData && (
            <p className="mt-2 text-sm text-red-600">
              Using demo data. <button 
                onClick={fetchMeals} 
                className="underline hover:text-red-900"
              >
                Try reconnecting
              </button>
            </p>
          )}
        </div>
      )}

      <div className="text-center mb-8">
        <div className="bg-gray-100 rounded-lg py-8 px-6 mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-3">
            <ChefHat className="w-10 h-10 text-gray-700" />
            Meal Planning Assistant
          </h1>
          <p className="text-gray-600 text-lg">Generate smart meal plans with ingredient aggregation</p>
        </div>
        
        {gifTriggered && (
          <div ref={gifRef} className="max-w-md mx-auto mb-6">
            <iframe 
              src="https://tenor.com/embed/25132285" 
              width="100%" 
              height="300" 
              frameBorder="0" 
              allowFullScreen
            ></iframe>
          </div>
        )}
      </div>

      {!showAccepted ? (
        <>
          <div className="text-center mb-8">
            <button
              onClick={generateMealPlan}
              className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-semibold text-lg"
              disabled={meals.length === 0}
            >
              GENERATE MEAL PLAN
            </button>
            {meals.length === 0 && (
              <p className="text-gray-500 mt-2 text-sm">No meals available</p>
            )}
          </div>

          {selectedMeals.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {selectedMeals.map((meal) => (
                  <div key={meal.id} className="border-2 border-gray-200 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 bg-white">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-xl font-semibold text-gray-800 flex-1">{meal.mealName}</h3>
                      <button
                        onClick={() => refreshSingleMeal(meal.id)}
                        className="ml-2 p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
                        title="Refresh this meal"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p className="flex items-center gap-2">
                        <Book className="w-4 h-4" />
                        <span className="font-medium">{meal.book}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Page {meal.page}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">Serves {meal.serves}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={acceptMeals}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg font-semibold"
                >
                  ACCEPT MEAL PLAN
                </button>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          <div className="mb-6">
            <button
              onClick={() => setShowAccepted(false)}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
            >
              <ChevronLeft className="w-5 h-5" />
              Back to Meal Selection
            </button>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ChefHat className="w-6 h-6 text-green-600" />
              Meal Overview
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-4 font-semibold text-gray-700">Meal</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Book</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Page</th>
                  </tr>
                </thead>
                <tbody>
                  {acceptedMeals.map((meal, index) => (
                    <tr key={meal.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 text-gray-800">{meal.mealName}</td>
                      <td className="p-4 text-gray-600">{meal.book}</td>
                      <td className="p-4 text-gray-600">{meal.page}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <ShoppingCart className="w-6 h-6 text-green-600" />
              Shopping List
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white rounded-lg shadow-md">
                <thead>
                  <tr className="bg-gray-100 border-b">
                    <th className="text-left p-4 font-semibold text-gray-700">Ingredient</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Total</th>
                    <th className="text-left p-4 font-semibold text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {aggregateIngredients(acceptedMeals).map((ingredient, index) => (
                    <tr key={`${ingredient.name}-${ingredient.unit}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4 text-gray-800 capitalize">{ingredient.name}</td>
                      <td className="p-4 text-gray-600">
                        {ingredient.quantity > 0 ? `${ingredient.quantity} ${ingredient.unit}` : 'As needed'}
                      </td>
                      <td className="p-4 text-gray-500 text-sm">
                        {ingredient.items.map(item => item.raw).join(', ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </main>
  );
}