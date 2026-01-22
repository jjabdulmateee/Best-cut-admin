export interface UserStats {
    totalUsers: number;
    totalBarbers: number;
    totalCustomers: number;
    activeUsers: number;
    monthlyActiveUsers: number;
    onlineUsers: number;
    newUsersToday: number;
    newUsersThisWeek: number;
    newUsersThisMonth: number;
}

export interface AnalyticsData {
    userStats: UserStats;
    lastUpdated: Date;
}
