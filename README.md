# What is JavHTML ?

Do you like java ?
Do you like xml ?
Me neither.

That's why I've created your worst possible nightmare (I'm late for Halloween, I know).
You can now write java code in xml syntax !!!

# How does it work ?
Write your code in the `/root` folder, and launch the `run` script.
Your code will be compiled to java in the output directory you desire, or by default `/java_output`.

# Syntax
First of all, you need to create a xml file, with at least one tag inside it.
That tag will be `file` with a `name` attribue :
```xml
<file name="Class">
</file>
```

This will create a file named `Class.java`.
You can now begin writing some classes :
```xml
<file name="Class">
    <class name="Class" visibility="public">
    </class>
</file>
```
Class created, let's add some variables :
```xml
<file name="Class">
    <class name="Class" visibility="public">
        <params>
            <myVariable static="true" type="int">42</myVariable>
        </params>
    </class>
</file>
```
And finally some methods :
```xml
<file name="Class">
    <class name="Class" visibility="public">
        <params>
            <myVariable static="true" type="int">42</myVariable>
        </params>
        <main visibility="public" static="true" type="void">
            <params>
                <args type="String[]" />
            </params>
            <hw type="String">"Hello world"</hw>
            <System.out.println>
                <params>
                    <hw />
                </params>
            </System.out.println>
        </main>
    </class>
</file>
```

# Documentation
-- will come one day ;)

# Enjoy :]