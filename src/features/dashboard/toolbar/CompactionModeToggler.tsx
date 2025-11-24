import { AlignHorizontalLeftIcon } from "../../../components/icons/AlignHorizontalLeftIcon";
import { AlignVerticalTopIcon } from "../../../components/icons/AlignVerticalTopIcon";
import { ToggleButton } from "../../../components/ToggleButton";
import {
  useToggleCompactionMode,
  useCompactionMode,
} from "../../../libs/store/compaction";
import { classNameToggleCompaction } from "../Toolbar";

export const CompactionModeToggler = () => {
  const toggleCompactionMode = useToggleCompactionMode();
  const compaction = useCompactionMode();
  
  return (
    <>
      <input
        type="checkbox"
        className="peer toggle toggle-sm"
        checked={compaction.enable}
        onChange={() => toggleCompactionMode("toggle-enable")}
      />
      <div className={`${classNameToggleCompaction}`}>
        <ToggleButton
          rotate
          iconOff={<AlignVerticalTopIcon />}
          iconOn={<AlignHorizontalLeftIcon />}
          value={compaction.mode}
          className="size-4 fill-current"
          onChange={() => toggleCompactionMode("toggle-mode")}
        />
      </div>
    </>
  );
};
