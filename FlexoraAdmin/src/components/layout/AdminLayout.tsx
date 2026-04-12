import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const AdminLayout = () => {
  return (
    <div className="h-screen overflow-hidden bg-brand-bg">
      <div className="mx-auto flex h-screen min-h-0 max-w-[1500px]">
        <Sidebar />
        <div className="flex h-screen min-h-0 flex-1 flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 min-h-0 overflow-hidden p-4 sm:p-5">
            <div className="mx-auto h-full min-h-0 w-full max-w-6xl overflow-hidden">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
