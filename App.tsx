
import React, { useState, useEffect } from 'react';
import { UserProfile, Course } from './types';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';

const STORAGE_KEY_DATA = 'learneye_app_data';

interface AppSaveData {
  users: {
    [name: string]: {
      profile: UserProfile;
      course: Course | null;
    }
  }
}

const App: React.FC = () => {
  const [saveData, setSaveData] = useState<AppSaveData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_DATA);
    return saved ? JSON.parse(saved) : { users: {} };
  });

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);

  // Sync state with global save data whenever a name is selected
  const handleSetUser = (u: UserProfile | null) => {
    if (u === null) {
      setCurrentUser(null);
      setCurrentCourse(null);
      return;
    }

    const existingData = saveData.users[u.name.trim()];
    if (existingData) {
      // Restore previous progress
      setCurrentUser(existingData.profile);
      setCurrentCourse(existingData.course);
    } else {
      // New user
      setCurrentUser(u);
      setCurrentCourse(null);
      
      // Initialize entry in save data
      const updatedData = {
        ...saveData,
        users: {
          ...saveData.users,
          [u.name.trim()]: { profile: u, course: null }
        }
      };
      setSaveData(updatedData);
      localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updatedData));
    }
  };

  const handleCourseUpdate = (course: Course) => {
    if (!currentUser) return;
    setCurrentCourse(course);
    
    const updatedData = {
      ...saveData,
      users: {
        ...saveData.users,
        [currentUser.name.trim()]: { ...saveData.users[currentUser.name.trim()], course }
      }
    };
    setSaveData(updatedData);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updatedData));
  };

  const handleProfileUpdate = (profile: UserProfile | null) => {
    if (profile === null) {
      handleSetUser(null);
      return;
    }
    
    setCurrentUser(profile);
    const updatedData = {
      ...saveData,
      users: {
        ...saveData.users,
        [profile.name.trim()]: { ...saveData.users[profile.name.trim()], profile }
      }
    };
    setSaveData(updatedData);
    localStorage.setItem(STORAGE_KEY_DATA, JSON.stringify(updatedData));
  };

  return (
    <div className="min-h-screen">
      {!currentUser ? (
        <Onboarding onComplete={handleSetUser} />
      ) : (
        <Dashboard 
          user={currentUser} 
          setUser={handleProfileUpdate} 
          initialCourse={currentCourse}
          onCourseUpdate={handleCourseUpdate}
        />
      )}
    </div>
  );
};

export default App;
