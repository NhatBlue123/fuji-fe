export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-text-main">Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to the admin panel</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">school</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
              <p className="text-2xl font-bold text-foreground">12</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400">group</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold text-foreground">1,234</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <span className="material-symbols-outlined text-yellow-600 dark:text-yellow-400">pending</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Draft Courses</p>
              <p className="text-2xl font-bold text-foreground">3</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <span className="material-symbols-outlined text-purple-600 dark:text-purple-400">published_with_changes</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-muted-foreground">Published Courses</p>
              <p className="text-2xl font-bold text-foreground">9</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}