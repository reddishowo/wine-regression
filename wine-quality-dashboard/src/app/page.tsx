"use client";

import { useState } from 'react';
import Head from 'next/head';

// Define ranges based on your EDA of the ORIGINAL (unscaled) data
const featureRanges = {
    'fixed acidity': { min: 4, max: 16, step: 0.1 },
    'volatile acidity': { min: 0, max: 1.6, step: 0.01 },
    'citric acid': { min: 0, max: 1.7, step: 0.01 },
    'chlorides': { min: 0, max: 0.7, step: 0.001 },
    'free sulfur dioxide': { min: 1, max: 300, step: 1 },
    'density': { min: 0.98, max: 1.04, step: 0.0001 },
    'alcohol': { min: 8, max: 15, step: 0.1 },
    'type_white': { min: 0, max: 1, step: 1 },
};

// Type matching the keys in featureRanges
type FeatureName = keyof typeof featureRanges;

export default function Home() {
    const [features, setFeatures] = useState<Record<FeatureName, number>>({
        'fixed acidity': 7.0,
        'volatile acidity': 0.27,
        'citric acid': 0.36,
        'chlorides': 0.05,
        'free sulfur dioxide': 30,
        'density': 0.995,
        'alcohol': 10.5,
        'type_white': 1,
    });

    const [prediction, setPrediction] = useState<number | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSliderChange = (name: FeatureName, value: string) => {
        setFeatures(prev => ({
            ...prev,
            [name]: parseFloat(value),
        }));
    };
    
    const handleTypeChange = (value: number) => {
        setFeatures(prev => ({
            ...prev,
            'type_white': value,
        }));
    };

    const handlePredict = async () => {
        setIsLoading(true);
        setError(null);
        setPrediction(null);

        try {
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fixed_acidity: features['fixed acidity'],
                    volatile_acidity: features['volatile acidity'],
                    citric_acid: features['citric acid'],
                    chlorides: features['chlorides'],
                    free_sulfur_dioxide: features['free sulfur dioxide'],
                    density: features['density'],
                    alcohol: features['alcohol'],
                    type_white: features['type_white'],
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Prediction request failed');
            }

            setPrediction(data.predicted_quality);

        } catch (err: any) {
            console.error(err);
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <Head>
                <title>Wine Quality Predictor</title>
                <meta name="description" content="Predict wine quality based on features" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className="flex flex-col items-center">
                <h1 className="text-3xl font-bold mb-6">Wine Quality Predictor</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
                    {Object.entries(featureRanges).map(([name, range]) => (
                        <div key={name} className="mb-4">
                            <label htmlFor={name} className="block text-sm font-medium text-gray-700 capitalize">
                                {name} ({name === 'type_white' ? (features['type_white'] === 1 ? 'White' : 'Red') : features[name as FeatureName].toFixed(range.step < 0.01 ? 4 : 2)})
                            </label>
                            {name === 'type_white' ? (
                                <div className="mt-1 flex rounded-md shadow-sm">
                                    <button 
                                        type="button" 
                                        onClick={() => handleTypeChange(0)} 
                                        className={`px-4 py-2 border ${features['type_white'] === 0 ? 'bg-red-600 text-white' : 'bg-white text-gray-700'} rounded-l-md focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                                    >
                                        Red
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => handleTypeChange(1)} 
                                        className={`px-4 py-2 border ${features['type_white'] === 1 ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'} rounded-r-md border-l-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500`}
                                    >
                                        White
                                    </button>
                                </div>
                            ) : (
                                <input
                                    type="range"
                                    id={name}
                                    name={name}
                                    min={range.min}
                                    max={range.max}
                                    step={range.step}
                                    value={features[name as FeatureName]}
                                    onChange={(e) => handleSliderChange(name as FeatureName, e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                                />
                            )}
                        </div>
                    ))}
                </div>

                <button
                    onClick={handlePredict}
                    disabled={isLoading}
                    className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                >
                    {isLoading ? 'Predicting...' : 'Predict Quality'}
                </button>

                {error && (
                    <p className="mt-4 text-red-600">Error: {error}</p>
                )}

                {prediction !== null && (
                    <div className="mt-6 p-4 border border-gray-300 rounded-md bg-gray-50 w-full max-w-xs text-center">
                        <h2 className="text-xl font-semibold">Predicted Quality:</h2>
                        <p className="text-4xl font-bold mt-2">{prediction.toFixed(1)}</p>
                        <p className="text-sm text-gray-600">(Model Prediction)</p>
                    </div>
                )}
            </main>
        </div>
    );
}