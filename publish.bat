@ECHO off

:: Script for copying and publishing (deploying) files to Github Hosting 
:: The nocopy option allows you to use the filemanager to hand copy a single file and then deploy without updating the whole site.

SET help=off
SET copy=on

IF "%1"=="help" (
	SET help=on 
   
) ELSE IF "%1"=="nocopy" (
   SET copy=off
)

IF %help%==on (
   ECHO(
	ECHO Parameters
	ECHO ---help
   ECHO ---nocopy //publish without copying
   ECHO(
   
) ELSE (
   IF %copy%==on (
      robocopy C:\Users\Jim\Documents\webcontent\jimandlaurie.co.nf  C:\Users\Jim\Documents\webcontent\github-website\family-home ^
                  /XD .git old-files ^
                  /XF publish.bat init.bat .gitignore README.md LICENSE.txt session* *workspace ^
                  /MIR /R:3 /W:5
   ) ELSE (
      ECHO(
      ECHO Robocopy was not used!
      ECHO(
   )

   git add .
   git commit -am "another update"
   git push origin main
)
