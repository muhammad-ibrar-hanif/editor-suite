import React, { useState } from 'react';
import JsonEditorPage from './pages/JsonEditorPage';
import XMLEditor from './pages/XMLEditor';
import YAMLEditor from './pages/YAMLEditor';
import TextComparer from './pages/TextComparer'; // New import
import Navigation from './components/Navigation';

const App: React.FC = () => {
    const [currentView, setCurrentView] = useState<'json' | 'xml' | 'yaml' | 'comparer'>('json');

    const renderCurrentView = () => {
        switch (currentView) {
            case 'json':
                return <JsonEditorPage />;
            case 'xml':
                return <XMLEditor />;
            case 'yaml':
                return <YAMLEditor />;
            case 'comparer':
                return <TextComparer />;
            default:
                return <JsonEditorPage />;
        }
    };

    return (
        <div className="App">
            <Navigation
                currentView={currentView}
                onViewChange={setCurrentView}
            />
            <main className="main-content">
                {renderCurrentView()}
            </main>
        </div>
    );
};

export default App;
//npm install react - json - view tailwindcss
//    (We’ll initialize Tailwind later with npx tailwindcss init)


//import { useEffect, useState } from 'react';
//import './App.css';
//import JsonEditorPage from './pages/JsonEditorPage';

//interface Forecast {
//    date: string;
//    temperatureC: number;
//    temperatureF: number;
//    summary: string;
//}

//function App() {
//    //const [forecasts, setForecasts] = useState<Forecast[]>();

//    //useEffect(() => {
//    //    populateWeatherData();
//    //}, []);

//    //const contents = forecasts === undefined
//    //    ? <p><em>Loading... Please refresh once the ASP.NET backend has started. See <a href="https://aka.ms/jspsintegrationreact">https://aka.ms/jspsintegrationreact</a> for more details.</em></p>
//    //    : <table className="table table-striped" aria-labelledby="tableLabel">
//    //        <thead>
//    //            <tr>
//    //                <th>Date</th>
//    //                <th>Temp. (C)</th>
//    //                <th>Temp. (F)</th>
//    //                <th>Summary</th>
//    //            </tr>
//    //        </thead>
//    //        <tbody>
//    //            {forecasts.map(forecast =>
//    //                <tr key={forecast.date}>
//    //                    <td>{forecast.date}</td>
//    //                    <td>{forecast.temperatureC}</td>
//    //                    <td>{forecast.temperatureF}</td>
//    //                    <td>{forecast.summary}</td>
//    //                </tr>
//    //            )}
//    //        </tbody>
//    //    </table>;

//    //return (
//    //    <div>
//    //        <h1 id="tableLabel">Weather forecast</h1>
//    //        <p>This component demonstrates fetching data from the server.</p>
//    //        {contents}
//    //    </div>
//    //);

//    //async function populateWeatherData() {
//    //    const response = await fetch('weatherforecast');
//    //    if (response.ok) {
//    //        const data = await response.json();
//    //        setForecasts(data);
//    //    }
//    //}
//}

//export default App;