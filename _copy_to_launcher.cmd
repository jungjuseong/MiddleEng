SET SRC=D:\myWork\react\app\fel40_react\output\resources\app\public\content
SET TGT=E:\myDocument\fel_launcher\resources\app\public\content

robocopy %SRC%\digenglish_lib %TGT%\digenglish_lib /MIR

:: LS
robocopy %SRC%\B_ls_comprehension %TGT%\fel\B_ls_comprehension /MIR
robocopy %SRC%\B_ls_voca %TGT%\fel\B_ls_voca /MIR


:: RW
robocopy %SRC%\B_rw_comprehension %TGT%\fel\B_rw_comprehension /MIR
robocopy %SRC%\B_ls_voca %TGT%\fel\B_rw_voca /MIR



