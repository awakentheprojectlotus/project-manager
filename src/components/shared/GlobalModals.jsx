import TaskFormModal from '../tasks/TaskFormModal';
import ProjectFormModal from '../projects/ProjectFormModal';
import MemberFormModal from '../team/MemberFormModal';
import MemberDetailModal from '../team/MemberDetailModal';

export default function GlobalModals() {
  return (
    <>
      <TaskFormModal />
      <ProjectFormModal />
      <MemberFormModal />
      <MemberDetailModal />
    </>
  );
}
