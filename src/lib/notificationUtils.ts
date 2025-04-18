
export const markAllNotificationsAsRead = () => {
  console.log("Marking all notifications as read");
  const storedNotifications = localStorage.getItem('notifications');
  if (!storedNotifications) return;
  
  try {
    const notifications: Notification[] = JSON.parse(storedNotifications);
    
    const updatedNotifications = notifications.map(notification => ({
      ...notification,
      read: true,
      previouslyDisplayed: true  // Mark as previously displayed
    }));
    
    console.log("Updated all notifications to read:", updatedNotifications);
    
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    const event = new CustomEvent('notificationsUpdated');
    window.dispatchEvent(event);
    
    return updatedNotifications;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return null;
  }
};
