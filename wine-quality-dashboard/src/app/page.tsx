"use client";

import { useState } from 'react';
import Head from 'next/head';

// Define ranges based on the 95th percentile of the original data
const featureRanges = {
    'fixed acidity': { min: 4, max: 12, step: 0.1 },        // 95th percentile ~11.8
    'volatile acidity': { min: 0, max: 0.9, step: 0.01 },   // 95th percentile ~0.85
    'citric acid': { min: 0, max: 0.8, step: 0.01 },        // 95th percentile ~0.75
    'chlorides': { min: 0, max: 0.2, step: 0.001 },         // 95th percentile ~0.18
    'free sulfur dioxide': { min: 1, max: 65, step: 1 },    // 95th percentile ~64
    'density': { min: 0.98, max: 1.01, step: 0.0001 },      // 95th percentile ~1.005
    'alcohol': { min: 8, max: 14, step: 0.1 },              // 95th percentile ~13.5
    'type_white': { min: 0, max: 1, step: 1 },              // Binary feature (0 or 1)
};

// Type matching the keys in featureRanges
type FeatureName = keyof typeof featureRanges;

// Define a type for error handling
type ErrorWithMessage = {
    message: string;
};

// Helper function for type checking errors
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
    return (
        typeof error === 'object' &&
        error !== null &&
        'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string'
    );
}

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
            const response = await fetch('https://bias-classifier.agreeablemushroom-fe0ec30e.southeastasia.azurecontainerapps.io/predict_wine', {
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

        } catch (err: unknown) {
            console.error(err);
            // Check if this might be a CORS error
            if (err instanceof TypeError && isErrorWithMessage(err) && err.message.includes('fetch')) {
                setError('Network error: This could be due to CORS restrictions. Please ensure the API allows requests from this origin.');
            } else {
                setError(isErrorWithMessage(err) ? err.message : 'An unknown error occurred');
            }
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